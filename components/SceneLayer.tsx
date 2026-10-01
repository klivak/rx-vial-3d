"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Experience = dynamic(() => import("@/components/Experience"), { ssr: false });

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Fixed 3D layer behind the HTML text. The poster stays until the first WebGL frame, or for good without WebGL. */
export function SceneLayer() {
  const [webgl, setWebgl] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => setWebgl(hasWebGL()), []);

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
        style={{ background: "radial-gradient(60% 45% at 50% 62%, #E9D9C4 0%, var(--background) 70%)" }}
      />
      {webgl && <Experience onReady={() => setReady(true)} />}
    </div>
  );
}
