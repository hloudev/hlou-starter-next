#!/usr/bin/env node
// Regenerates the committed SAMPLE under `site/` and `public/media/` from the
// renderer's fixture, in exactly the shape `hlou-builder` materialises:
//
//   site/snapshot.json          the fixture, media URLs rewritten to /media/<assetId>/<file>
//   site/content.ts             `renderContentTs()` from apps/builder (published records)
//   site/messages/<locale>.json `snapshotSiteMessages()` from apps/builder
//   site/tw-classes.txt         `siteStyleClasses()` from the renderer, one per line
//   public/media/<assetId>/<file>  placeholder JPEGs (sharp) so `next build` fetches nothing
//
// Run from the Hlou monorepo root, where the fixture and the builder live
// (neither is vendored) — tsx resolves the builder's extensionless imports:
//
//   node_modules/.bin/tsx hlou-starter-next/scripts/fixture-from-renderer.mts
//
// `HLOU_RENDERER_FIXTURE` / `HLOU_BUILDER_MATERIALISE` override the two paths.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

type Media = {
  id: string;
  url: string;
  width?: number;
  height?: number;
  mime: string;
};
type Snapshot = {
  locales: Array<{ code: string }>;
  media: Record<string, Media>;
  theme: { colors: Array<{ key: string; value: string }> };
  [key: string]: unknown;
};

const here = dirname(fileURLToPath(import.meta.url));
const starterRoot = resolve(here, "..");
const monorepoRoot = resolve(starterRoot, "..");
const fixturePath =
  process.env.HLOU_RENDERER_FIXTURE ??
  join(monorepoRoot, "packages/site-renderer/src/__fixtures__/snapshot.ts");
const materialisePath =
  process.env.HLOU_BUILDER_MATERIALISE ??
  join(monorepoRoot, "apps/builder/src/materialise.ts");

// Everything below delegates to the builder's own functions, so the sample is
// exactly what `materialise()` writes and cannot drift from it.
const { fixtureSnapshot } = (await import(pathToFileURL(fixturePath).href)) as {
  fixtureSnapshot: unknown;
};
const { mediaFileName, renderContentTs } = (await import(
  pathToFileURL(materialisePath).href
)) as {
  mediaFileName: (asset: Media) => string;
  renderContentTs: (snapshot: Snapshot) => string;
};
const {
  siteSnapshotSchema,
  snapshotLocales,
  snapshotSiteMessages,
  withResolvedMediaUrls,
} = (await import(
  pathToFileURL(join(dirname(materialisePath), "types/snapshot.ts")).href
)) as {
  siteSnapshotSchema: { parse: (value: unknown) => Snapshot };
  snapshotLocales: (snapshot: Snapshot) => { codes: string[] };
  snapshotSiteMessages: (
    snapshot: Snapshot,
    locale: string,
  ) => Record<string, string>;
  withResolvedMediaUrls: (
    snapshot: Snapshot,
    resolve: (assetId: string) => string | null,
  ) => Snapshot;
};

// What the builder imports as `@hlou/site-renderer/tw`, beside the fixture.
const { siteStyleClasses } = (await import(
  pathToFileURL(join(dirname(fixturePath), "..", "blocks", "tw.ts")).href
)) as {
  siteStyleClasses: (snapshot: Snapshot) => string[];
};

/* ------------------------------ snapshot.json ----------------------------- */

// The builder copies each asset to `public/media/<assetId>/<file>` and
// rewrites the URL to match — in `media` and inside block props alike.
const parsed = siteSnapshotSchema.parse(fixtureSnapshot);
const media: Record<string, Media> = {};
for (const [assetId, asset] of Object.entries(parsed.media)) {
  media[assetId] = {
    ...asset,
    url: `/media/${assetId}/${mediaFileName(asset)}`,
  };
}
const snapshot = withResolvedMediaUrls(
  { ...parsed, media },
  (assetId) => media[assetId]?.url ?? null,
);

const siteDir = join(starterRoot, "site");
mkdirSync(join(siteDir, "messages"), { recursive: true });
writeFileSync(
  join(siteDir, "snapshot.json"),
  `${JSON.stringify(snapshot, null, 2)}\n`,
);

/* ------------------------------- content.ts ------------------------------- */

writeFileSync(join(siteDir, "content.ts"), renderContentTs(snapshot));

/* ---------------------------- tw-classes.txt ------------------------------ */

// The utilities the site's stored styles map to; `app/globals.css` scans it.
writeFileSync(
  join(siteDir, "tw-classes.txt"),
  `${siteStyleClasses(snapshot).join("\n")}\n`,
);

/* ------------------------------ messages/*.json --------------------------- */

// Falls back to the source locale per slot, as the starter expects.
const { codes } = snapshotLocales(snapshot);
for (const locale of codes) {
  writeFileSync(
    join(siteDir, "messages", `${locale}.json`),
    `${JSON.stringify(snapshotSiteMessages(snapshot, locale), null, 2)}\n`,
  );
}

/* ------------------------------ public/media ------------------------------ */

const require = createRequire(join(starterRoot, "package.json"));
const sharp = require("sharp") as typeof import("sharp").default;
const mediaRoot = join(starterRoot, "public", "media");
rmSync(mediaRoot, { recursive: true, force: true });
// `theme.colors` is an extensible list of roles (`{key, value}[]`), not
// fixed `paper`/`accent`/`ink` fields.
const themeColor = (key: string, fallback: string) =>
  snapshot.theme.colors.find((c) => c.key === key)?.value ?? fallback;
const paperColor = themeColor("paper", "#f4f1ea");
const accentColor = themeColor("accent", "#b0552f");
const inkColor = themeColor("ink", "#1c1a17");
for (const asset of Object.values(snapshot.media)) {
  const target = join(starterRoot, "public", asset.url);
  mkdirSync(dirname(target), { recursive: true });
  const width = asset.width ?? 1200;
  const height = asset.height ?? 900;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${paperColor}"/>
    <stop offset="1" stop-color="${accentColor}"/>
  </linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${width * 0.72}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.16}" fill="${inkColor}" fill-opacity="0.12"/>
</svg>`;
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 70, mozjpeg: true })
    .toFile(target);
}

console.log(
  `fixture-from-renderer: wrote site/snapshot.json, site/content.ts, site/tw-classes.txt, ${snapshot.locales.length} message files, ${Object.keys(snapshot.media).length} media placeholders`,
);
