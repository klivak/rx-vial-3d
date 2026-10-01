// Minimal gzip static server for out/, mounted under the GitHub Pages basePath so production paths resolve like on Pages.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { createGzip } from "node:zlib";

const BASE = "/rx-vial-3d";
const ROOT = "out";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
  ".usdz": "model/vnd.usdz+zip",
};
const compressible = new Set([".html", ".js", ".css", ".json", ".txt"]);

export function serveOut(port = 4173) {
  const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
    if (!url.startsWith(BASE)) {
      res.writeHead(302, { location: `${BASE}/` }).end();
      return;
    }
    let file = normalize(join(ROOT, url.slice(BASE.length)));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    const ext = extname(file);
    const headers = { "content-type": types[ext] ?? "application/octet-stream" };
    if (compressible.has(ext) && /gzip/.test(req.headers["accept-encoding"] ?? "")) {
      res.writeHead(200, { ...headers, "content-encoding": "gzip" });
      createReadStream(file).pipe(createGzip()).pipe(res);
    } else {
      res.writeHead(200, headers);
      createReadStream(file).pipe(res);
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (process.argv[1]?.endsWith("serve-out.mjs")) {
  await serveOut();
  console.log("Serving out/ at http://localhost:4173/rx-vial-3d/");
}
