"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";

const MAX_LOADER_MS = 7000;
/** The loader stays at least this long, so it reads as a calm intro rather than a flash. */
const MIN_LOADER_MS = 1600;
/** Extra hold after the first 3D frame: shaders and the environment map settle before the reveal. */
const SETTLE_MS = 600;

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
 * Fixed 3D layer behind the HTML text. A full-screen loader covers the page (and locks scroll) until the first WebGL frame, so
 * the boot never shows half-built frames. The poster of frame 1 stays for good without WebGL.
 */
export function SceneLayer() {
  const [webgl, setWebgl] = useState(false);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Start every visit at the top: restored mid-page scroll would show the scene in the wrong frame behind the loader.
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    if (hasWebGL()) setWebgl(true);
    else setLoaded(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const wait = Math.max(SETTLE_MS, MIN_LOADER_MS - performance.now());
    const timer = setTimeout(() => setLoaded(true), wait);
    return () => clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    // Never hold the page hostage: a slow GPU or network still gets the poster after a few seconds.
    const timer = setTimeout(() => setLoaded(true), MAX_LOADER_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loaded) document.documentElement.classList.remove("is-loading");
  }, [loaded]);

  return (
    <>
      <div id="scene-layer" className="fixed inset-0 z-0" aria-hidden="true">
        <picture
          data-poster
          className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
        >
          <source media="(max-width: 767px)" srcSet={asset("/poster-mobile.webp")} />
          <img
            src={asset("/poster-desktop.webp")}
            alt=""
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
        </picture>
        <div className="studio-light absolute inset-0" />
        {webgl && <Experience onReady={() => setReady(true)} onLost={() => setReady(false)} />}
      </div>
      <div
        role="status"
        aria-label="Loading"
        className={`loader fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background transition-[opacity,visibility] duration-1000 ease-out ${loaded ? "is-done invisible pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <span className="loader-ring" />
        <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted">
          Aurel Daily
        </span>
        <span className="h-px w-32 overflow-hidden bg-foreground/10">
          <span className="loader-bar block h-full bg-accent" />
        </span>
      </div>
    </>
  );
}
