#!/usr/bin/env node
// Serves the static export in `out/` the way a static host does — `/fr/` →
// `fr/index.html`, `/fr` → `fr.html` or `fr/index.html`, unknown → `404.html`.
//
//   pnpm preview            http://localhost:4173
//   PORT=5000 pnpm preview
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd(), "out");
const port = Number(process.env.PORT ?? 4173);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function isFile(path) {
  return existsSync(path) && statSync(path).isFile();
}

function locate(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(
    /^(\.\.[/\\])+/,
    "",
  );
  const base = join(root, clean);
  if (!base.startsWith(root)) return null;
  const candidates = clean.endsWith("/")
    ? [join(base, "index.html")]
    : [base, `${base}.html`, join(base, "index.html")];
  return candidates.find(isFile) ?? null;
}

if (!existsSync(root)) {
  console.error(
    `serve-out: ${root} does not exist — run \`pnpm build\` first.`,
  );
  process.exit(1);
}

createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const file = locate(url.pathname);
  const notFound = join(root, "404.html");
  const target = file ?? (isFile(notFound) ? notFound : null);
  if (!target) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(file ? 200 : 404, {
    "content-type": TYPES[extname(target)] ?? "application/octet-stream",
    "cache-control": "no-cache",
  });
  createReadStream(target).pipe(response);
}).listen(port, () => {
  console.log(`serve-out: http://localhost:${port}/ ← ${root}`);
});
