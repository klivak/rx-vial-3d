/**
 * Pointer (desktop) or device tilt (Android) as a -1..1 offset, read by the camera each frame. Listeners are passive and only
 * write two numbers; nothing re-renders.
 */
export const parallax = { x: 0, y: 0 };

export function startParallax({ tilt: useTilt = true }: { tilt?: boolean } = {}): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const pointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    parallax.x = (e.clientX / innerWidth) * 2 - 1;
    parallax.y = (e.clientY / innerHeight) * 2 - 1;
  };
  // About 20 degrees of tilt reaches the full offset; the angle the phone is first held at is the neutral point.
  let rest: number | null = null;
  const tilt = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    rest ??= e.beta;
    parallax.x = Math.max(-1, Math.min(1, e.gamma / 20));
    parallax.y = Math.max(-1, Math.min(1, (e.beta - rest) / 20));
  };

  window.addEventListener("pointermove", pointer, { passive: true });
  // iOS gates orientation behind a permission prompt; we never ask, so iPhones keep the plain camera.
  const needsPermission = typeof (window.DeviceOrientationEvent as unknown as { requestPermission?: unknown })?.requestPermission === "function";
  if (useTilt && !needsPermission) window.addEventListener("deviceorientation", tilt, { passive: true });
  return () => {
    window.removeEventListener("pointermove", pointer);
    window.removeEventListener("deviceorientation", tilt);
  };
}
