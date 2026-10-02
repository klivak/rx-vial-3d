/** Flat play button for the loader and the no-WebGL poster: the same silhouette the 3D button is extruded from. */
export function PlayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28.57 20" className={className} aria-hidden="true">
      <path
        fill="#FF0033"
        d="M27.97 3.12C27.64 1.89 26.68.93 25.45.6 23.22 0 14.27 0 14.27 0S5.32 0 3.09.6C1.86.93.9 1.89.57 3.12 0 5.35 0 10 0 10s0 4.65.57 6.88c.33 1.23 1.29 2.19 2.52 2.52C5.32 20 14.27 20 14.27 20s8.95 0 11.18-.6c1.23-.33 2.19-1.29 2.52-2.52.6-2.23.6-6.88.6-6.88s0-4.65-.6-6.88z"
      />
      <path className="play-mark-tri" fill="#FFFFFF" d="M11.4 14.29 18.83 10 11.4 5.71z" />
    </svg>
  );
}
