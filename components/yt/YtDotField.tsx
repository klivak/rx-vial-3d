"use client";

import { useEffect, useRef } from "react";
import { columnShare } from "@/lib/yt/layout";
import { ytState } from "@/lib/yt/state";

const GAP = 28;
/** Radius in px around the mouse within which dots part and light up. */
const REACH = 150;
const PUSH = 14;
/** Alpha steps for the pre-built colour strings: 1/128 is finer than the eye can tell on a 1.4 px dot. */
const LEVELS = 128;
const shades = (rgb: string) => Array.from({ length: LEVELS + 1 }, (_, k) => `rgba(${rgb},${(k / LEVELS).toFixed(4)})`);
const RED = shades("255,70,100");
const BLUE = shades("190,205,255");

/**
 * Backdrop dot grid that answers the mouse: dots part softly around the pointer and brighten, a wide soft light trails behind it,
 * and dots near the 3D button pick up its red. One 2D canvas; the loop runs only while something moves and sleeps otherwise.
 * The native cursor is left alone. Touch and reduced motion get the still grid (plus the button tint on scroll).
 */
export function YtDotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(pointer: fine)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let off = new Float32Array(0);
    const mouse = { x: -9999, y: -9999, lx: -9999, ly: -9999, last: 0 };
    let raf = 0;
    /** What the last frame drew for the button tint, so a scroll that does not change it does not redraw ~3,000 dots. */
    const drawn = { bx: 0, by: 0, br: 0, redness: -1 };

    // Sized from the canvas itself: its parent is `h-lvh`, so `innerHeight` (the small viewport on mobile) left a strip of stretched dots.
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.round(box.width);
      h = Math.round(box.height);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      cols = Math.ceil(w / GAP) + 1;
      rows = Math.ceil(h / GAP) + 1;
      off = new Float32Array(cols * rows * 2);
      wake();
    };

    const draw = (now: number) => {
      raf = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // The trailing light lags behind the pointer, so it feels like it is being pulled along.
      mouse.lx += (mouse.x - mouse.lx) * 0.08;
      mouse.ly += (mouse.y - mouse.ly) * 0.08;
      if (mouse.lx > -999) {
        const g = ctx.createRadialGradient(mouse.lx, mouse.ly, 0, mouse.lx, mouse.ly, 380);
        g.addColorStop(0, "rgba(110,139,255,0.075)");
        g.addColorStop(1, "rgba(110,139,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(mouse.lx - 380, mouse.ly - 380, 760, 760);
      }

      // Where the button is on screen, for the red tint of nearby dots.
      const bx = w / 2 + ytState.x * (w / 2) * columnShare(w);
      const by = h / 2 - ytState.y * (h / 2);
      const br = Math.max(1, ytState.scale * h * 1.1);
      const redness = ytState.fill * ytState.glow * (1 - Math.min(1, ytState.tier) * (1 - ytState.lacquer));
      drawn.bx = bx;
      drawn.by = by;
      drawn.br = br;
      drawn.redness = redness;
      const t = now / 1000;
      let style = "";
      const ox = (w % GAP) / 2;
      const oy = (h % GAP) / 2;
      let moving = false;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = (r * cols + c) * 2;
          const x = ox + c * GAP;
          const y = oy + r * GAP;
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const d = Math.hypot(dx, dy);
          const near = d < REACH ? 1 - d / REACH : 0;
          // Spring each dot towards its pushed-away target, so the field ripples back when the mouse leaves.
          const tx = near ? (dx / (d || 1)) * PUSH * near * near : 0;
          const ty = near ? (dy / (d || 1)) * PUSH * near * near : 0;
          off[i] += (tx - off[i]) * 0.14;
          off[i + 1] += (ty - off[i + 1]) * 0.14;
          if (Math.abs(tx - off[i]) + Math.abs(ty - off[i + 1]) > 0.05) moving = true;

          // Fade towards the screen edges, a faint slow wave across the field, light near the mouse and red near the button.
          const ex = Math.min(x, w - x) / (w * 0.5);
          const ey = Math.min(y, h - y) / (h * 0.5);
          const edge = Math.min(1, Math.min(ex, ey) * 2.2);
          const wave = calm ? 0 : 0.03 * (0.5 + 0.5 * Math.sin(x * 0.012 + y * 0.008 - t * 0.9));
          const bd = Math.hypot(x - bx, y - by) / br;
          const glow = bd < 1.4 ? (1 - bd / 1.4) * redness : 0;
          const a = (0.07 + wave + near * near * 0.55) * edge + glow * 0.35;
          if (a < 0.01) continue;
          const size = 1.4 + near * 1.2;
          const k = Math.min(LEVELS, Math.round(a * LEVELS));
          const next = glow > near ? RED[k] : BLUE[k];
          if (next !== style) ctx.fillStyle = style = next;
          ctx.fillRect(x + off[i] - size / 2, y + off[i + 1] - size / 2, size, size);
        }
      }

      // Keep animating while the mouse was active recently, the dots are still settling or the light is catching up.
      const lagging = Math.abs(mouse.x - mouse.lx) + Math.abs(mouse.y - mouse.ly) > 0.5;
      if (!calm && (moving || lagging || now - mouse.last < 2500)) wake();
    };

    // Scrolling moves the button, so the red tint has to follow it; with no tint in view there is nothing to redraw.
    const scrolled = () => {
      const redness = ytState.fill * ytState.glow * (1 - Math.min(1, ytState.tier) * (1 - ytState.lacquer));
      if (redness === 0 && drawn.redness === 0) return;
      const bx = w / 2 + ytState.x * (w / 2) * columnShare(w);
      const by = h / 2 - ytState.y * (h / 2);
      const br = Math.max(1, ytState.scale * h * 1.1);
      if (Math.abs(bx - drawn.bx) + Math.abs(by - drawn.by) + Math.abs(br - drawn.br) < 0.5 && Math.abs(redness - drawn.redness) < 0.005) return;
      wake();
    };

    function wake() {
      if (!raf) raf = requestAnimationFrame(draw);
    }

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (mouse.lx < -999) {
        mouse.lx = e.clientX;
        mouse.ly = e.clientY;
      }
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.last = performance.now();
      wake();
    };
    const leave = () => {
      mouse.x = mouse.y = -9999;
      wake();
    };

    // One resize per frame; on touch the toolbar showing or hiding only nudges the height, which is not worth rebuilding the field for.
    let sizing = 0;
    const touch = !matchMedia("(pointer: fine)").matches;
    const queueResize = () => {
      if (sizing) return;
      sizing = requestAnimationFrame(() => {
        sizing = 0;
        const box = canvas.getBoundingClientRect();
        if (touch && Math.round(box.width) === w && Math.abs(box.height - h) < 120) return;
        resize();
      });
    };
    const observer = new ResizeObserver(queueResize);

    resize();
    observer.observe(canvas);
    window.addEventListener("scroll", scrolled, { passive: true });
    if (!calm) {
      window.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerleave", leave);
    }
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(sizing);
      observer.disconnect();
      window.removeEventListener("scroll", scrolled);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <canvas ref={ref} data-dots aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
