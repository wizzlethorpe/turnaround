// The naming rule, the choice of frame to draw, and the draw coalescing, without a browser.

import test from "node:test";
import assert from "node:assert/strict";

import { turnaroundPaths, frameAt, latest } from "../scripts/frames.mjs";

test("the turnaround sits beside the image under the same name, as a WebP or a GIF", () => {
  assert.deepEqual(turnaroundPaths("worlds/brine/Agatha.png"),
    ["worlds/brine/Agatha-turnaround.webp", "worlds/brine/Agatha-turnaround.gif"]);
  assert.deepEqual(turnaroundPaths("https://host/a.b/Agatha.jpg?v=3"),
    ["https://host/a.b/Agatha-turnaround.webp?v=3", "https://host/a.b/Agatha-turnaround.gif?v=3"]);
  assert.deepEqual(turnaroundPaths("art/Agatha-turnaround.gif"),
    ["art/Agatha-turnaround.webp", "art/Agatha-turnaround.gif"], "opening the turnaround itself finds it under its own name");
});

test("a downloaded turnaround spreads its frames across the whole slider", () => {
  assert.equal(frameAt(0, 160, 1), 0);
  assert.equal(frameAt(0.5, 160, 1), 80);
  assert.equal(frameAt(1, 160, 1), 159, "the far end is the last frame, not one past it");
});

test("a turnaround still downloading fills only the part of the slider it has reached", () => {
  assert.equal(frameAt(0.125, 40, 0.25), 20, "halfway through the quarter that has arrived");
  assert.equal(frameAt(0.9, 40, 0.25), 39, "past it, the newest frame there is");
});

test("a frame already shown is not drawn again", async () => {
  const drawn = [];
  const show = latest(async (frame) => drawn.push(frame));
  await show(0);
  await show(0);
  await show(5);
  assert.deepEqual(drawn, [0, 5]);
});

test("frames asked for during a draw give way to the newest", async () => {
  const drawn = [];
  let open;
  const gate = new Promise((resolve) => (open = resolve));
  const show = latest(async (frame) => { drawn.push(frame); await gate; });
  const done = show(1);
  show(2);
  show(3);
  open();
  await done;
  assert.deepEqual(drawn, [1, 3]);
});

test("a frame that fails to draw does not block the next one", async () => {
  const drawn = [];
  const show = latest(async (frame) => { if (frame === 1) throw new Error("corrupt"); drawn.push(frame); });
  await assert.rejects(show(1));
  await show(2);
  assert.deepEqual(drawn, [2]);
});
