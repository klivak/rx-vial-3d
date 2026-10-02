"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { PlayMark } from "@/components/yt/PlayMark";
import { startSmoothScroll, unlockScroll } from "@/lib/yt/smoothScroll";

const MAX_LOADER_MS = 7000;
const MIN_LOADER_MS = 1500;
const SETTLE_MS = 500;

const YtExperience = dynamic(() => import("@/components/yt/YtExperience"), { ssr: false });

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Fixed backdrop of the YouTube page: brand light and grid, the red glow that trails the button, the 3D canvas, and a loader with
 * a YouTube-style progress line that holds the page (and Lenis) until the first frame. Without WebGL the flat button stays.
 */
export function YtSceneLayer() {
  const [webgl, setWebgl] = useState(false);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    if (hasWebGL()) setWebgl(true);
    else setLoaded(true);
    return startSmoothScroll();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setLoaded(true), Math.max(SETTLE_MS, MIN_LOADER_MS - performance.now()));
    return () => clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), MAX_LOADER_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.classList.remove("is-loading");
    unlockScroll();
  }, [loaded]);

  return (
    <>
      <div id="scene-layer" className="fixed inset-0 z-0" aria-hidden="true">
        <div className="yt-backdrop absolute inset-0" />
        <div className="yt-grid absolute inset-0" />
        <div className="yt-glow absolute inset-0" />
        <PlayMark className={`yt-poster transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`} />
        {webgl && <YtExperience onReady={() => setReady(true)} onLost={() => setReady(false)} />}
      </div>
      <div
        role="status"
        aria-label="Loading"
        className={`loader fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background transition-[opacity,visibility] duration-700 ease-out ${loaded ? "is-done invisible pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <span className="absolute inset-x-0 top-0 h-[3px] overflow-hidden">
          <span className="loader-bar block h-full bg-[#FF0033]" />
        </span>
        <PlayMark className="yt-loader-mark h-10 w-auto" />
        <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted">AIR · YouTube Channel Audit</span>
      </div>
    </>
  );
}
