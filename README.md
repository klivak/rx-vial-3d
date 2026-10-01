# rx-vial-3d

Scroll-driven 3D product page for **Aurel**, a fictional telehealth brand: an amber Rx vial, a five-frame camera story, an unboxing, a cap colour configurator and "View in AR" that puts the vial on your table at real size.

**Live demo:** [klivak.github.io/rx-vial-3d](https://klivak.github.io/rx-vial-3d/) (open it on a phone)

Stack: Next.js 15 (static export) · React Three Fiber · Three.js · GSAP ScrollTrigger · Tailwind CSS · Playwright · GitHub Pages.

## What to look at

1. **Hero:** the vial breathes (±2° sway) under a studio softbox.
2. **Formula:** the camera pushes in on the label.
3. **How it works:** a 92° orbit; the cap, label and box light up in turn with the three steps.
4. **Unboxing:** the box lid snaps open, the vial lifts and its shadow spreads.
5. **CTA:** wide shot, background one tone deeper. Drag sideways to spin the vial, pick a cap colour, tap "View in AR".

## Motion decisions

- **One timeline, scrubbed with inertia.** A single GSAP timeline is tied to page scroll with `scrub: 0.9`, so the camera trails your finger a little instead of sticking to it.
- **Move, then rest.** Each scroll segment spends 80% moving and 20% on a still plateau. The pauses are what make it feel calm.
- **Camera first, words second.** Text reveals (`power3.out`) start after the camera has mostly arrived, never at the same time.
- **Few eases, used on purpose.** `power2.inOut` for the camera, `power3.out` for text, `expo.out` only for the box lid. No bounce, no elastic.
- **Guard rails in data.** All frame states live in [`lib/frames.ts`](lib/frames.ts) as numbers. The camera orbits its target by azimuth, so a tween can never cut through the model, and a dev check warns if a frame turns more than 120° or gets too close.
- **Reduced motion.** With `prefers-reduced-motion` there is no camera travel and no sway. Each frame cuts to its final state behind a 0.15 s canvas fade.

## Architecture

- **GSAP writes, `useFrame` reads.** GSAP animates a plain mutable object ([`lib/sceneState.ts`](lib/sceneState.ts)) and components apply it to the camera and meshes in `useFrame`. Scrolling never re-renders React.
- **Demand frameloop.** The canvas draws only when the timeline updates, the vial sways, the turntable has momentum or the cap colour is easing. When nothing moves, the GPU is idle.
- **Model built in code, one source of truth.** The vial is a `LatheGeometry` profile in metres with real glass wall thickness, a canvas-drawn label and barcode, and a procedural knurl normal map on the cap. The box is thin walls with a hinged lid. [`lib/scene/buildVial.ts`](lib/scene/buildVial.ts) is plain Three.js, used both by the site and by the AR exporter.
- **Native AR, no viewer library.** A dev-only route exports GLB and USDZ for each cap colour from the same code ([`scripts/export-models.mjs`](scripts/export-models.mjs)). iOS opens Quick Look through `<a rel="ar">`, and Android opens Scene Viewer through an intent URL. Both launch synchronously from the tap, so iOS keeps the user gesture, and the page downloads nothing extra. This replaces `<model-viewer>` from the original spec and gives up its WebXR mode. Desktop shows a QR code that carries the chosen colour.

## Performance decisions

- **Text first.** All text is static HTML and the hero is never animated in, so it is the LCP element. A 6–8 KB WebP poster of frame 1 shows instantly, and the 3D bundle starts loading on `requestIdleCallback`.
- **Quality tiers.** Desktop gets `MeshPhysicalMaterial` transmission glass. Phones and weak CPUs start on alpha glass with fewer lathe segments and a smaller label texture. `PerformanceMonitor` moves between tiers at runtime; `?quality=low|high` forces one.
- **Zero-download lighting.** The studio environment is a handful of emissive planes baked once through `PMREMGenerator`. There is no HDRI, and none of the HDR/EXR/gain-map loaders a generic environment component bundles.
- **Shadows.** The vial's contact shadow redraws only when a frame is drawn. The box shadow is baked once and travels with the box.
- **Own turntable.** A ~60-line pointer turntable with momentum replaces OrbitControls. The canvas keeps `touch-action: pan-y`, so vertical swipes still scroll the page.
- **Resilience.** On WebGL context loss (iOS background tabs) the poster comes back and the scene redraws on restore. Without WebGL, the poster and full text remain.
- **Budgets enforced in CI** ([`scripts/check-budgets.mjs`](scripts/check-budgets.mjs)):

| Budget | Limit | Now |
|---|---|---|
| JS a phone downloads, gzip, full scroll | 400 KB | ~400 KB (Three.js core alone is ~187 KB) |
| AR model per file | 1 MB | 108 KB GLB · 227 KB USDZ |
| Poster | 80 KB | 6–8 KB |

## Accessibility

- One `h1` and an `h2` per frame. The canvas is `aria-hidden` and a text description sits next to it.
- Skip link, visible focus rings, and keyboard scrolling works because it is ordinary page scroll.
- The cap colour control is a real radio group: roving tabindex, arrow keys, `aria-checked`.
- Text contrast is AA on both backgrounds (lowest pair 4.87:1).
- Lighthouse (local, mobile): Accessibility 100, Best Practices 100.

## Run locally

```bash
pnpm install
pnpm dev                       # http://localhost:3000
pnpm dev --hostname 0.0.0.0    # open from a phone on the same network
pnpm build                     # static export to out/
pnpm test                      # Playwright smoke tests against out/ (Android, iPhone, reduced motion, desktop)
pnpm check-budgets             # JS and model size budgets
pnpm export-models             # re-export AR models (dev server running)
pnpm make-poster               # re-render the loading posters (dev server running)
```

Debug helpers: `?debug` shows an FPS panel, and `?quality=low|high` forces a quality tier.

## Project map

```
app/                 layout, page, dev-only AR export route (page.dev.tsx)
components/          Experience (canvas), Vial, Box, CameraRig, Turntable, ScrollTimeline, SceneLayer, Sections, CtaActions, ArButton
lib/frames.ts        the five frame states (desktop and mobile), as data
lib/sceneState.ts    mutable state GSAP writes and useFrame reads
lib/scene/           plain Three.js builders: vial, box, studio environment
lib/textures/        canvas label and cap normal map
scripts/             model export, poster render, budgets, static server
tests/               Playwright smoke tests
docs/                SPEC.md and PLAN.md
```

Aurel is a fictional brand. This is a design demo, not medical advice.
