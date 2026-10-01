import { CanvasTexture, RepeatWrapping } from "three";

let cached: CanvasTexture | null = null;

/** Tangent-space normal map of vertical ridges for the knurled cap, generated once instead of downloaded. */
export function createCapNormalTexture(): CanvasTexture {
  if (cached) return cached;
  const w = 256;
  const h = 4;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const ridges = 24;
  for (let x = 0; x < w; x++) {
    const nx = Math.sin((x / w) * ridges * Math.PI * 2) * 0.55;
    const nz = Math.sqrt(1 - nx * nx);
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = 128;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  cached = new CanvasTexture(canvas);
  cached.wrapS = cached.wrapT = RepeatWrapping;
  cached.repeat.set(3, 1);
  return cached;
}
