"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";

const BOOT_DELAY_MS = 4000;

const Experience = dynamic(() => import("@/components/Experience"), { ssr: false });

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Fixed 3D layer behind the HTML text. A pre-rendered poster of frame 1 shows until the first WebGL frame (and stays for good
 * without WebGL). The 3D bundle loads on first interaction or shortly after load, so the text and poster paint first.
 */
export function SceneLayer() {
  const [webgl, setWebgl] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasWebGL()) return;
    // The poster is frame 1 pixel for pixel, so the WebGL boot (shader compile, PMREM) can wait for the first touch, scroll or key,
    // or a short pause after load. It then never competes with the text paint and first input.
    const events = ["pointerdown", "touchstart", "wheel", "scroll", "keydown"] as const;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      cleanup();
      setWebgl(true);
    };
    const arm = () => (timer = setTimeout(start, BOOT_DELAY_MS));
    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("load", arm);
      for (const e of events) window.removeEventListener(e, start);
    }
    for (const e of events) window.addEventListener(e, start, { once: true, passive: true });
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
    return cleanup;
  }, []);

  return (
    <div id="scene-layer" className="fixed inset-0 z-0" aria-hidden="true">
      <picture data-poster className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}>
        <source media="(max-width: 767px)" srcSet={asset("/poster-mobile.webp")} />
        <img src={asset("/poster-desktop.webp")} alt="" fetchPriority="high" className="h-full w-full object-cover" />
      </picture>
      <div className="studio-light absolute inset-0" />
      {webgl && <Experience onReady={() => setReady(true)} onLost={() => setReady(false)} />}
    </div>
  );
}
