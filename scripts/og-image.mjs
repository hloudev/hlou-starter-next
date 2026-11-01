#!/usr/bin/env node
// Renders the default social card to `public/og.png` from `site/snapshot.json`.
// The card itself is the renderer's (`renderer/site/og.ts`, shared with the
// kernel build method); this script only rasterises it with `next/og`'s
// ImageResponse — satori + resvg with a bundled font, so it needs no system
// fonts and runs in the builder's container. Runs as `prebuild`; the head
// names `/og.png` for every page without a `seo.image` of its own (page slot,
// then site slot). The site logo (`site.logoImage`) is read from `public/`
// as a `data:` URL — satori fetches nothing.
//
// `og.ts` is import-free, so Node loads it with its own type stripping.
//
// A file-convention `app/opengraph-image.tsx` would do the same at build time,
// but `output: "export"` writes it without an extension (`out/opengraph-image`)
// and static hosts then serve it without an image content-type.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const { ImageResponse } = await import(require.resolve("next/og"));
const { createElement } = require("react");
const { ogImage } = await import(
  pathToFileURL(join(root, "renderer", "site", "og.ts")).href
);

const snapshot = JSON.parse(
  readFileSync(join(root, "site/snapshot.json"), "utf8"),
);
const name = snapshot.settings?.siteName ?? snapshot.project?.name ?? "Site";

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};
/** `/media/<id>/<file>` as a `data:` URL of the file in `public/`, or no image. */
function publicDataUrl(url) {
  const mime = MIME[extname(url).toLowerCase()];
  if (!mime || !url.startsWith("/") || url.includes("..")) return null;
  try {
    const bytes = readFileSync(join(root, "public", url));
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

const card = ogImage(snapshot, createElement, { resolveSrc: publicDataUrl });

const response = new ImageResponse(card.element, {
  width: card.width,
  height: card.height,
});
const target = join(root, "public", "og.png");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, Buffer.from(await response.arrayBuffer()));
console.log(`og-image: wrote public/og.png for "${name}"`);
