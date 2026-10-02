"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { PlayMark } from "@/components/yt/PlayMark";
import { YtDotField } from "@/components/yt/YtDotField";
import { YtLoader } from "@/components/yt/YtLoader";
import { startSmoothScroll, unlockScroll } from "@/lib/yt/smoothScroll";
import { BUTTON_IN_AT, LOADER_UNMOUNT_AT, TEXT_IN_AT } from "@/lib/yt/introTiming";
import { startYtIntro } from "@/lib/yt/state";

const MAX_LOADER_MS = 7000;
/** Long enough to read the loader as an intro, not a flash; any longer only delays the content on fast connections. */
const MIN_LOADER_MS = 1600;
const SETTLE_MS = 500;

const loadExperience = () => import("@/components/yt/YtExperience");
// Start fetching the 3D chunk (three.js, fiber) as soon as this module runs in the browser, not after hydration and the first effect.
const experienceChunk = typeof window !== "undefined" ? loadExperience() : null;
const YtExperience = dynamic(loadExperience, { ssr: false });

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
  const [loaderGone, setLoaderGone] = useState(false);
  // Real milestones for the loader bar: page hydrated, 3D code downloaded, first frame drawn.
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    setProgress(20);
    if (hasWebGL()) {
      setWebgl(true);
      // Same chunk next/dynamic loads below; resolving it here tells the bar the download is done.
      (experienceChunk ?? loadExperience()).then(() => setProgress((p) => Math.max(p, 62)));
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
    // The hero waits for the loader's circle to uncover it (lib/yt/introTiming.ts); unmounting the loader afterwards stops its
    // endless feed and wave animations.
    startYtIntro(BUTTON_IN_AT);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => {
      document.documentElement.classList.remove("is-loading");
      unlockScroll();
    }, still ? 0 : TEXT_IN_AT);
    const gone = setTimeout(() => setLoaderGone(true), LOADER_UNMOUNT_AT);
    return () => {
      clearTimeout(timer);
      clearTimeout(gone);
    };
  }, [loaded]);

  return (
    <>
      {/* Sized to the largest viewport (lvh): the phone address bar showing or hiding must not resize the canvas and jolt the button. */}
      <div id="scene-layer" className="fixed inset-x-0 top-0 z-0 h-lvh" aria-hidden="true">
        <div className="yt-backdrop absolute inset-0" />
        <div className="yt-aurora absolute inset-0 overflow-hidden" />
        <YtDotField />
        <div className="yt-glow absolute inset-0" />
        <PlayMark className={`yt-poster transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`} />
        {webgl && <YtExperience onReady={() => setReady(true)} onLost={() => setReady(false)} open={loaded} />}
        <div className="yt-grain pointer-events-none absolute inset-0" />
      </div>
      {!loaderGone && <YtLoader target={progress} done={loaded} />}
    </>
  );
}
