// Shared by the browser suites and the two capture/quality scripts: where the real frame (the dark part of the photograph, not the
// white margins around it) sits on the screen. The home photo may be wider than the screen on a phone, with only its white
// margins falling outside, so « the whole frame is shown » is measured on what is drawn, not on the box of the <img>.
//
// The probe is a plain JavaScript source STRING evaluated in the page (page.evaluate(frameInkSource)): a function written in
// TypeScript and handed to page.evaluate would be rewritten by the runner that compiles it (tsx keeps function names with a
// helper that does not exist in the page). A pixel is background when it is transparent or when its darkest channel is at
// least 235 (white and the faintest shadow); everything else is frame. The photo is read through a canvas at most 480 px wide;
// it is served by the same origin, so the canvas stays readable.
export interface FrameInk {
  loaded: boolean;
  fit: string;
  naturalWidth: number;
  naturalHeight: number;
  rasterWidth: number;
  rasterHeight: number;
  /** The box of the <img> in viewport coordinates. */
  box: { left: number; right: number; top: number; bottom: number; width: number; height: number };
  /** The drawn frame in viewport coordinates, or null when it cannot be read (see `error`). */
  ink: { left: number; right: number; top: number; bottom: number; width: number; height: number } | null;
  error: string | null;
  screen: { width: number; height: number };
}
export const frameInkSource = `(async () => {
  const image = document.querySelector('.showcase-image img');
  if (!image) return null;
  const rect = image.getBoundingClientRect();
  const out = {
    loaded: image.complete && image.naturalWidth > 0, fit: getComputedStyle(image).objectFit, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
    rasterWidth: 0, rasterHeight: 0,
    box: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }, ink: null, error: null,
    screen: { width: innerWidth, height: innerHeight },
  };
  if (!out.loaded) { out.error = 'photo not loaded'; return out; }
  try {
    // naturalWidth/Height are density-corrected and each rounded down for width-descriptor srcsets.
    // Measure the encoded raster to check its real proportions, without increasing the allowed distortion.
    const bitmap = await createImageBitmap(await (await fetch(image.currentSrc)).blob());
    out.rasterWidth = bitmap.width; out.rasterHeight = bitmap.height;
    const scale = Math.min(rect.width / bitmap.width, rect.height / bitmap.height, out.fit === 'scale-down' ? 1 : Infinity);
    const drawnWidth = bitmap.width * scale, drawnHeight = bitmap.height * scale;
    const originX = rect.left + (rect.width - drawnWidth) / 2, originY = rect.top + (rect.height - drawnHeight) / 2;
    const canvas = document.createElement('canvas');
    const reduction = Math.min(1, 480 / bitmap.width);
    canvas.width = Math.max(1, Math.round(bitmap.width * reduction));
    canvas.height = Math.max(1, Math.round(bitmap.height * reduction));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width, maxX = -1, minY = canvas.height, maxY = -1;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const at = (y * canvas.width + x) * 4;
        if (data[at + 3] < 16 || Math.min(data[at], data[at + 1], data[at + 2]) >= 235) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) { out.error = 'no frame found in the photo (all background)'; return out; }
    const stepX = drawnWidth / canvas.width, stepY = drawnHeight / canvas.height;
    const left = originX + minX * stepX, right = originX + (maxX + 1) * stepX, top = originY + minY * stepY, bottom = originY + (maxY + 1) * stepY;
    out.ink = { left, right, top, bottom, width: right - left, height: bottom - top };
  } catch (error) { out.error = String(error); }
  return out;
})()`;
