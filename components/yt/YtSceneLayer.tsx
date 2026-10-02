"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { PlayMark } from "@/components/yt/PlayMark";
import { YtLoader } from "@/components/yt/YtLoader";
import { startSmoothScroll, unlockScroll } from "@/lib/yt/smoothScroll";

const MAX_LOADER_MS = 7000;
/** Long enough to read the loader as an intro, not a flash. */
const MIN_LOADER_MS = 2400;
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
 * Fixed backdrop of the YouTube page: brand light and grid, the red glow that trails the button, the 3D canvas, and a player-style
 * loader that holds the page (and Lenis) until the first frame. Without WebGL the flat button stays.
 */
export function YtSceneLayer() {
  const [webgl, setWebgl] = useState(false);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Real milestones for the loader bar: page hydrated, 3D code downloaded, first frame drawn.
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    setProgress(20);
    if (hasWebGL()) {
      setWebgl(true);
      // Same chunk next/dynamic loads below; resolving it here tells the bar the download is done.
      import("@/components/yt/YtExperience").then(() => setProgress((p) => Math.max(p, 62)));
    } else setLoaded(true);
    return startSmoothScroll();
  }, []);

  useEffect(() => {
    if (ready) setProgress(90);
  }, [ready]);

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
      {/* Sized to the largest viewport (lvh): the phone address bar showing or hiding must not resize the canvas and jolt the button. */}
      <div id="scene-layer" className="fixed inset-x-0 top-0 z-0 h-lvh" aria-hidden="true">
        <div className="yt-backdrop absolute inset-0" />
        <div className="yt-grid absolute inset-0" />
        <div className="yt-glow absolute inset-0" />
        <PlayMark className={`yt-poster transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`} />
        {webgl && <YtExperience onReady={() => setReady(true)} onLost={() => setReady(false)} />}
      </div>
      <YtLoader target={progress} done={loaded} />
    </>
  );
}
