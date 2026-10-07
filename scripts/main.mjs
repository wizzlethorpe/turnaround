import { turnaroundPaths, frameAt, latest } from "./frames.mjs";

Hooks.on("renderImagePopout", async (_, element) => {
  const img = element.querySelector("figure img");
  if (!img || !globalThis.ImageDecoder) return;
  for (const url of turnaroundPaths(img.src)) {
    const response = await download(url);
    if (response) return mount(img, response);
  }
});

// Foundry serves every file as no-store, so the browser keeps nothing between popouts.
// The copy kept here is reused while the server answers 304 to its ETag.
async function download(url) {
  const cache = await globalThis.caches?.open("turnaround");
  const cached = await cache?.match(url);
  const response = await fetch(url, { headers: cached ? { "if-none-match": cached.headers.get("etag") } : {} });
  if (response.status === 304) return cached;
  if (!response.ok) return null;
  cache?.put(url, response.clone());
  return response;
}

// The figure can be turned through the frames that have arrived while the rest download.
async function mount(img, response) {
  const slider = Object.assign(document.createElement("input"), {
    type: "range",
    className: "turnaround",
    min: 0,
    max: 1,
    step: "any",
    value: 0,
  });
  slider.setAttribute("aria-label", game.i18n.localize("TURNAROUND.Turn"));

  const size = Number(response.headers.get("content-length"));
  let bytes = 0;
  const counted = new TransformStream({
    transform(chunk, controller) {
      bytes += chunk.length;
      slider.style.setProperty("--loaded", `${100 * bytes / size}%`);
      controller.enqueue(chunk);
    },
  });
  const decoder = new ImageDecoder({ data: response.body.pipeThrough(counted), type: response.headers.get("content-type") });

  const canvas = Object.assign(document.createElement("canvas"), { className: "turnaround" });
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", img.alt);
  const context = canvas.getContext("2d");
  const show = latest(async (index) => {
    const { image } = await decoder.decode({ frameIndex: index });
    canvas.width = image.displayWidth;
    canvas.height = image.displayHeight;
    context.drawImage(image, 0, 0);
    image.close();
  });
  await show(0);

  const track = decoder.tracks.selectedTrack;
  slider.addEventListener("input", () => show(frameAt(slider.valueAsNumber, track.frameCount, bytes / size)));
  img.replaceWith(canvas, slider);
}
