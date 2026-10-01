"use client";

import { useEffect, useState } from "react";
import { Scene } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";
import { capColorValue, type CapColorId } from "@/lib/capColor";
import { buildVial } from "@/lib/scene/buildVial";
import { theme } from "@/lib/theme";

/**
 * Dev-only page (the .dev.tsx extension is only routed in development, see next.config.ts).
 * Builds the same vial the site renders and exports it for AR; scripts/export-models.mjs drives it with Playwright.
 */
async function exportAll(): Promise<Record<string, string>> {
  await document.fonts.ready;
  const files: Record<string, string> = {};
  for (const { id } of theme.capColors) {
    const scene = new Scene();
    const vial = buildVial({ quality: "ar", capColor: capColorValue(id as CapColorId) });
    scene.add(vial.group);

    const glb = (await new GLTFExporter().parseAsync(scene, { binary: true })) as ArrayBuffer;
    const usdz = await new USDZExporter().parseAsync(scene, { quickLookCompatible: true });
    files[`vial-${id}.glb`] = toBase64(new Uint8Array(glb));
    files[`vial-${id}.usdz`] = toBase64(usdz);
    vial.dispose();
  }
  return files;
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

declare global {
  interface Window {
    exportModels?: () => Promise<Record<string, string>>;
  }
}

export default function ExportPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    window.exportModels = exportAll;
    setReady(true);
  }, []);
  return <p className="p-8">{ready ? "Exporter ready: run node scripts/export-models.mjs" : "Loading"}</p>;
}
