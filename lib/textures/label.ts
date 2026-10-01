import { CanvasTexture, SRGBColorSpace } from "three";
import { theme } from "@/lib/theme";

/** Deterministic fake EAN-style bars so the label looks real without encoding a real product. */
function drawBarcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let cx = x;
  ctx.fillStyle = theme.foreground;
  while (cx < x + w) {
    const bar = 2 + Math.floor(rand() * 4) * 2;
    ctx.fillRect(cx, y, bar, h);
    cx += bar + 2 + Math.floor(rand() * 3) * 2;
  }
}

function fontFamily() {
  return typeof document === "undefined" ? "sans-serif" : getComputedStyle(document.body).fontFamily;
}

export function drawLabel(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;
  const s = w / 1024;
  const font = (weight: number, size: number) => `${weight} ${size * s}px ${fontFamily()}`;

  ctx.fillStyle = "#F7F3EA";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, w, 18 * s);
  ctx.fillRect(0, h - 18 * s, w, 18 * s);

  // Only the middle of the texture faces the camera; keep content inside it.
  const left = 250 * s;
  ctx.fillStyle = theme.foreground;
  ctx.font = font(600, 34);
  ctx.fillText("A U R E L", left, 110 * s);
  ctx.font = font(600, 84);
  ctx.fillText("Aurel Daily", left, 220 * s);
  ctx.fillStyle = theme.muted;
  ctx.font = font(400, 32);
  ctx.fillText("10 mg  ·  30 capsules", left, 285 * s);
  ctx.fillText("Take one daily as prescribed.", left, 330 * s);

  ctx.fillStyle = theme.accent;
  ctx.font = font(600, 26);
  ctx.fillText("Rx ONLY", left, 420 * s);
  ctx.fillStyle = theme.muted;
  ctx.font = font(400, 20);
  ctx.fillText("Demo product. Not for use.", left, 455 * s);

  drawBarcode(ctx, 560 * s, 380 * s, 200 * s, 90 * s);
  ctx.font = font(400, 18);
  ctx.fillText("0 48213 90517 3", 575 * s, 500 * s);
}

const cache = new Map<number, CanvasTexture>();

export function createLabelTexture(size: 512 | 1024 = 1024): CanvasTexture {
  const hit = cache.get(size);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = Math.round(size * 0.5625);
  drawLabel(canvas);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  // GLTFExporter embeds this as JPEG instead of PNG, keeping the AR model small.
  texture.userData.mimeType = "image/jpeg";
  cache.set(size, texture);
  // Web fonts may land after the first draw; redraw once they are ready.
  document.fonts?.ready.then(() => {
    drawLabel(canvas);
    texture.needsUpdate = true;
  });
  return texture;
}
