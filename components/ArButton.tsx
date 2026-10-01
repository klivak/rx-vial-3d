"use client";

import { useEffect, useRef, useState } from "react";
import { buttonBase } from "@/components/buttonStyles";
import { asset } from "@/lib/asset";
import { getCapColor } from "@/lib/capColor";

type ArMode = "quick-look" | "scene-viewer" | "none";

/** iOS Safari advertises Quick Look through <a rel="ar">; Android gets Scene Viewer through an intent URL; everything else gets a QR code. */
function detectArMode(): ArMode {
  const a = document.createElement("a");
  if (a.relList?.supports?.("ar")) return "quick-look";
  if (/Android/i.test(navigator.userAgent)) return "scene-viewer";
  return "none";
}

function absolute(path: string) {
  return new URL(asset(path), window.location.href).href;
}

/**
 * Native AR launch without model-viewer: both paths start from the tap synchronously (iOS drops the user gesture after an
 * async import), and no extra library is downloaded. Models are exported from the site's own vial code per cap colour.
 */
function launchAr(mode: ArMode) {
  const cap = getCapColor();
  if (mode === "quick-look") {
    const a = document.createElement("a");
    a.rel = "ar";
    a.href = asset(`/models/vial-${cap}.usdz`);
    // Quick Look requires the anchor to wrap an image.
    a.appendChild(document.createElement("img"));
    // Safari ignores clicks on detached anchors in some versions, so attach it for the duration of the click.
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  const file = encodeURIComponent(absolute(`/models/vial-${cap}.glb`));
  const fallback = encodeURIComponent(window.location.href);
  window.location.href =
    `intent://arvr.google.com/scene-viewer/1.2?file=${file}&mode=ar_preferred&resizable=false&title=Aurel%20Daily` +
    `#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`;
}

/** Most "AR does nothing" reports come from in-app browsers or phones without AR support, so spell out the requirements. */
function ArTips({ className = "" }: { className?: string }) {
  return (
    <details className={`text-left text-sm text-muted ${className}`}>
      <summary className="cursor-pointer">AR not opening?</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Open the page in Safari (iPhone) or Chrome (Android), not inside Telegram, Instagram or a QR scanner app.</li>
        <li>iPhone / iPad: iOS 12 or newer. Tap &ldquo;View in AR&rdquo;, then point the camera at a table.</li>
        <li>Android: install or update &ldquo;Google Play Services for AR&rdquo; and the Google app, then tap &ldquo;View in AR&rdquo;.</li>
        <li>Scan the QR code from the live site, not from localhost.</li>
      </ul>
    </details>
  );
}

function QrDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [svg, setSvg] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open || svg) return;
    // The QR encoder is only fetched when someone on a desktop asks for it.
    import("qrcode-generator").then(({ default: qrcode }) => {
      const qr = qrcode(0, "M");
      qr.addData(window.location.href.split("#")[0] + `#cap=${getCapColor()}`);
      qr.make();
      setSvg(qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true }));
    });
  }, [open, svg]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="qr-title"
      className="m-auto w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-background p-6 text-center text-foreground shadow-xl backdrop:bg-foreground/30"
    >
      <h2 id="qr-title" className="text-lg font-semibold">
        Open on your phone
      </h2>
      <p className="mt-2 text-sm text-muted">Scan with the camera, then tap &ldquo;View in AR&rdquo; to place the vial on your table.</p>
      <div className="mx-auto mt-5 aspect-square w-48 rounded-xl bg-white p-2" dangerouslySetInnerHTML={{ __html: svg }} />
      <ArTips className="mt-5" />
      <button type="button" onClick={onClose} className={`${buttonBase} mt-5 border border-foreground/20 hover:bg-foreground/5`}>
        Close
      </button>
    </dialog>
  );
}

export function ArButton() {
  const [mode, setMode] = useState<ArMode | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => setMode(detectArMode()), []);

  return (
    <>
      <button
        type="button"
        onClick={() => (mode === "none" ? setQrOpen(true) : mode && launchAr(mode))}
        className={`${buttonBase} border border-foreground/20 hover:bg-foreground/5`}
      >
        {mode === "none" ? "View in AR on your phone" : "View in AR"}
      </button>
      {mode && mode !== "none" && <ArTips className="mx-auto mt-1 max-w-sm basis-full" />}
      <QrDialog open={qrOpen} onClose={() => setQrOpen(false)} />
    </>
  );
}
