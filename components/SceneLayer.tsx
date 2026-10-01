"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";

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
 * without WebGL). The 3D bundle starts loading only once the browser is idle, so the text and poster paint first.
 */
export function SceneLayer() {
  const [webgl, setWebgl] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasWebGL()) return;
    const start = () => setWebgl(true);
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(start, { timeout: 1500 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(start, 200);
    return () => clearTimeout(id);
  }, []);

  return (
    <div id="scene-layer" className="fixed inset-0 z-0" aria-hidden="true">
      <picture data-poster className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}>
        <source media="(max-width: 767px)" srcSet={asset("/poster-mobile.webp")} />
        <img src={asset("/poster-desktop.webp")} alt="" fetchPriority="high" className="h-full w-full object-cover" />
      </picture>
      {webgl && <Experience onReady={() => setReady(true)} onLost={() => setReady(false)} />}
    </div>
  );
}
