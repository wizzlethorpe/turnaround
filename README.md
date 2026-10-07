# Turnaround

Turn a figure around in Foundry's image popout.

HeroForge exports a turnaround as an animated WebP or GIF that never stops spinning. With this module the actor's image is an ordinary still on sheets, tokens and the sidebar, and the popout shows the figure at rest with a slider under it that turns it.

Requires Foundry v14, in a Chromium browser or Firefox 133 or later.

## Use

1. Upload two files to the same folder in Foundry: the still, and the HeroForge turnaround named after it with `-turnaround` added. For example `Agatha.png` and `Agatha-turnaround.webp`.
2. Use the still wherever the image goes, such as the actor's portrait.
3. Open the image popout and move the slider.

The still can be a WebP, PNG, JPEG or any other image. The turnaround is a `.webp` or a `.gif`, as HeroForge exports them. A popout opened on the turnaround file itself gets the slider too.

## Behavior

- Every image popout asks the server for a `-turnaround.webp` beside its image, then a `-turnaround.gif`. An image with neither shows as usual, and the browser console logs the two 404s.
- The figure can be turned as soon as the first frames arrive. While the rest downloads, the solid part of the slider's track is the part that has arrived, and a position beyond it shows the newest frame there is.
- The download is kept in the browser's cache storage and reused until the file on the server changes. Over plain HTTP on an address other than localhost the browser has no cache storage, and the turnaround downloads on every open.
- A browser without the `ImageDecoder` API shows the still alone.

## File size

A HeroForge WebP at 512 pixels is about 30 MB and a GIF about 12 MB. The GIF has a solid background where the WebP is transparent.

`make-turnaround` from [workshop](../workshop) is optional. It rewrites the WebP, the GIF or HeroForge's zip of PNG frames at 128 frames and writes a matching still. From the WebP or the zip the result is transparent and about 3.5 MB.

## Development

```bash
node --test 'test/*.test.mjs'
```

No build step. `scripts/frames.mjs` holds the naming rule, the choice of frame to draw and the draw coalescing, and runs without Foundry. `scripts/main.mjs` is the `renderImagePopout` hook, the download and the canvas.
