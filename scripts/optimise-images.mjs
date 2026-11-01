#!/usr/bin/env node
// Brings raster images under budget in place: longest edge capped at 2000px,
// then a quality ladder 85 → 46 until the file is ≤ 400 KB; if it still is not,
// the edge drops to 1600px @ 60 and 1400px @ 55. Generalises the agency's
// `sips` ladder with sharp. JPEG stays JPEG (mozjpeg), PNG stays PNG, WebP stays
// WebP; SVG and GIF are left alone.
//
//   pnpm optimise-images                  public/media/**
//   pnpm optimise-images path/to/dir …    any directories or files
//   MAX_EDGE=1600 MAX_KB=250 pnpm optimise-images
import { readdir, rename, stat, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import sharp from "sharp";

const MAX_EDGE = Number(process.env.MAX_EDGE ?? 2000);
const MAX_BYTES = Number(process.env.MAX_KB ?? 400) * 1024;
const QUALITY_LADDER = [85, 78, 72, 65, 58, 52, 46];
const FALLBACKS = [
  { edge: 1600, quality: 60 },
  { edge: 1400, quality: 55 },
];
const RASTER = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function* walk(path) {
  const info = await stat(path);
  if (info.isFile()) {
    if (RASTER.has(extname(path).toLowerCase())) yield path;
    return;
  }
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    yield* walk(join(path, entry.name));
  }
}

function encode(pipeline, extension, quality) {
  switch (extension) {
    case ".png":
      return pipeline.png({ quality, palette: true, compressionLevel: 9 });
    case ".webp":
      return pipeline.webp({ quality });
    default:
      return pipeline.jpeg({ quality, mozjpeg: true });
  }
}

async function attempt(source, extension, edge, quality) {
  const pipeline = sharp(source).rotate().resize({
    width: edge,
    height: edge,
    fit: "inside",
    withoutEnlargement: true,
  });
  return encode(pipeline, extension, quality).toBuffer();
}

async function optimise(file) {
  const extension = extname(file).toLowerCase();
  const before = (await stat(file)).size;
  let best = null;

  for (const quality of QUALITY_LADDER) {
    const buffer = await attempt(file, extension, MAX_EDGE, quality);
    if (!best || buffer.length < best.length) best = buffer;
    if (buffer.length <= MAX_BYTES) break;
  }
  for (const { edge, quality } of FALLBACKS) {
    if (best && best.length <= MAX_BYTES) break;
    const buffer = await attempt(file, extension, edge, quality);
    if (!best || buffer.length < best.length) best = buffer;
  }

  if (!best || best.length >= before) {
    console.log(`  = ${file} (${(before / 1024).toFixed(0)} KB, kept)`);
    return;
  }
  const temporary = `${file}.tmp`;
  await writeFile(temporary, best);
  await rename(temporary, file);
  const flag = best.length > MAX_BYTES ? " still over budget" : "";
  console.log(
    `  ✓ ${file} ${(before / 1024).toFixed(0)} KB → ${(best.length / 1024).toFixed(0)} KB${flag}`,
  );
}

const targets = process.argv.slice(2).map((path) => resolve(path));
if (targets.length === 0) targets.push(resolve("public/media"));

for (const target of targets) {
  console.log(`optimise-images: ${target}`);
  for await (const file of walk(target)) await optimise(file);
}
