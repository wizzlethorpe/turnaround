// Which files may hold an image's turnaround, which frame to draw, and how draws give way to newer ones.

export function turnaroundPaths(src) {
  return ["webp", "gif"].map((type) => src.replace(/(-turnaround)?\.\w+(?=$|[?#])/, `-turnaround.${type}`));
}

// The frame at a slider position from 0 to 1.
// While the file downloads, `loaded` frames have arrived in the `received` fraction of it, and they fill that much of the slider.
export function frameAt(position, loaded, received) {
  return Math.min(Math.floor(position * loaded / received), loaded - 1);
}

// A slider asks for frames faster than they decode.
// The returned function draws the newest value asked for and skips the ones a draw in flight made stale.
export function latest(draw) {
  let shown;
  let wanted;
  let busy = false;
  return async (value) => {
    wanted = value;
    if (busy) return;
    busy = true;
    try {
      while (shown !== wanted) {
        const next = wanted;
        await draw(next);
        shown = next;
      }
    } finally {
      busy = false;
    }
  };
}
