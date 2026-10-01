const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefixes a public/ path with the GitHub Pages basePath (static export does not do this for fetch, useGLTF or model-viewer). */
export function asset(path: string): string {
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}
