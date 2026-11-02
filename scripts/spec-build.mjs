#!/usr/bin/env node
// Compiles the site spec (`hlou/site/**`) into what the site
// renders — the files Hlou's builder writes from its own snapshot:
//
//   site/snapshot.json          the SiteSnapshot (`compileSpecToSnapshot`)
//   site/content.ts             typed published records (`renderContentTs`)
//   site/messages/<locale>.json the site slots' text per locale (`snapshotSiteMessages`)
//   site/tw-classes.txt         the utilities the stored styles map to (`siteBuildClasses`)
//
// Everything comes from the vendored renderer (`renderer/`), so the same spec
// renders here as Hlou builds it, with no Hlou package and no network.
//
//   node scripts/spec-build.mjs            compile once; exit 1 on an invalid spec   (pnpm hlou:compile)
//   node scripts/spec-build.mjs --if-spec  the same, and nothing at all without hlou/site/site.json (pnpm build)
//   node scripts/spec-build.mjs --dev …    compile, recompile on every change under hlou/site/
//                                          and public/media/, and run `next dev …` (pnpm dev)
//
// Without a spec (`hlou/site/site.json`), `site/` is left as it is. Inside
// Hlou's builder (`HLOU_BUILDER=1`, set on every starter build it runs),
// `--if-spec` leaves it as it is too, spec or not: Hlou never builds from a
// user's spec, and that tree's `site/` is the one Hlou wrote.
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  watch,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_DIR = join(root, "hlou", "site");
const SITE_JSON = join(SPEC_DIR, "site.json");
const SITE_DIR = join(root, "site");
const MEDIA_DIR = join(root, "public", "media");

const args = process.argv.slice(2);
const dev = args[0] === "--dev";
const ifSpec = dev || args.includes("--if-spec");

/* ---------------------------------------------------------------------------- */
/*                                    Files                                     */
/* ---------------------------------------------------------------------------- */

/** Every file under `dir`, by path relative to the starter's root (posix). */
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir).sort()) {
    if (entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(relative(root, full).split(sep).join("/"));
  }
  return out;
}

/**
 * What `compileSpecToSnapshot` reads: the spec's JSON as text, the lock and
 * `hlou/export.json` when present, and every medium's presence. Also the
 * newest change among them, the snapshot's `generatedAt`: the same spec
 * compiles to the same bytes.
 */
function readSpecFiles() {
  const files = {};
  let newest = 0;
  const read = (path) => {
    const full = join(root, path);
    files[path] = readFileSync(full, "utf8");
    newest = Math.max(newest, statSync(full).mtimeMs);
  };
  for (const path of walk(SPEC_DIR)) read(path);
  for (const path of ["hlou/site.lock.json", "hlou/export.json"]) {
    if (existsSync(join(root, path))) read(path);
  }
  for (const path of walk(MEDIA_DIR)) files[path] = true;
  return { files, generatedAt: new Date(Math.floor(newest)).toISOString() };
}

/** Writes `text` only when it changed, through a rename: HMR never sees half a file. */
function writeIfChanged(path, text) {
  if (existsSync(path) && readFileSync(path, "utf8") === text) return false;
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, text);
  renameSync(temporary, path);
  return true;
}

/* ---------------------------------------------------------------------------- */
/*                                   Compile                                    */
/* ---------------------------------------------------------------------------- */

/** The vendored renderer, through tsx (it is TypeScript and JSX). */
async function loadRenderer() {
  /* The starter's package is CommonJS-typed, so `.ts` files load through
     `require`: tsx's CommonJS hook resolves their extensionless imports. */
  const [{ register: registerCjs }, { register: registerEsm }] =
    await Promise.all([import("tsx/cjs/api"), import("tsx/esm/api")]);
  registerCjs();
  registerEsm();
  /* A CommonJS module's exports arrive as its namespace's `default`. */
  const load = async (path) => {
    const module = await import(
      pathToFileURL(join(root, "renderer", path)).href
    );
    return { ...module, ...module.default };
  };
  const [spec, output, design] = await Promise.all([
    load("spec/index.ts"),
    load("site/output.ts"),
    load("blocks/design.ts"),
  ]);
  return { ...spec, ...output, ...design };
}

function formatPath(path) {
  return path.length === 0
    ? ""
    : ` at ${path
        .map((part) => (typeof part === "number" ? `[${part}]` : `.${part}`))
        .join("")
        .replace(/^\./, "")}`;
}

/** One compile: true when `site/` now holds the spec, false (and why) when it does not. */
function compile(renderer) {
  const started = Date.now();
  const { files, generatedAt } = readSpecFiles();
  const result = renderer.compileSpecToSnapshot(files, { generatedAt });
  if (!result.ok) {
    console.error(
      `hlou:compile: the spec has ${result.errors.length} error(s); site/ is unchanged`,
    );
    for (const error of result.errors) {
      console.error(
        `  ${error.file}${formatPath(error.path)}  [${error.code}] ${error.message}`,
      );
    }
    return false;
  }

  const { snapshot } = result;
  let written = 0;
  const write = (path, text) => {
    if (writeIfChanged(join(SITE_DIR, path), text)) written += 1;
  };
  write(
    "tw-classes.txt",
    `${renderer.siteBuildClasses(snapshot).join("\n")}\n`,
  );
  write("content.ts", renderer.renderContentTs(snapshot));
  for (const { code } of snapshot.locales) {
    write(
      join("messages", `${code}.json`),
      `${JSON.stringify(renderer.snapshotSiteMessages(snapshot, code), null, 2)}\n`,
    );
  }
  /* Last: the file Next's HMR reloads the pages for. */
  write("snapshot.json", `${JSON.stringify(snapshot, null, 2)}\n`);

  console.log(
    `hlou:compile: ${snapshot.pages.length} pages, ${snapshot.locales.length} locales → site/ ` +
      `(${written} file${written === 1 ? "" : "s"} changed, ${Date.now() - started} ms)`,
  );
  return true;
}

/* ---------------------------------------------------------------------------- */
/*                                     Dev                                      */
/* ---------------------------------------------------------------------------- */

/** Recompiles on every change under the spec and the media, debounced. */
function watchSpec(renderer) {
  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        compile(renderer);
      } catch (error) {
        console.error(
          `hlou:compile: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }, 60);
  };
  const watchers = [];
  for (const dir of [join(root, "hlou"), MEDIA_DIR]) {
    if (!existsSync(dir)) continue;
    watchers.push(watch(dir, { recursive: true }, schedule));
  }
  console.log("hlou:compile: watching hlou/site/ and public/media/");
  return () => watchers.forEach((watcher) => watcher.close());
}

function runNextDev(rest) {
  const bin = join(
    root,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "next.cmd" : "next",
  );
  const child = spawn(bin, ["dev", ...rest], { cwd: root, stdio: "inherit" });
  const forward = (signal) => () => child.kill(signal);
  process.on("SIGINT", forward("SIGINT"));
  process.on("SIGTERM", forward("SIGTERM"));
  return child;
}

/* ---------------------------------------------------------------------------- */
/*                                     Main                                     */
/* ---------------------------------------------------------------------------- */

if (ifSpec && !dev && process.env.HLOU_BUILDER === "1") {
  console.log(
    "hlou:compile: Hlou's builder — site/ is Hlou's, the spec is not compiled",
  );
  process.exit(0);
}

const hasSpec = existsSync(SITE_JSON);

if (!hasSpec && !ifSpec) {
  console.error(
    `hlou:compile: no ${relative(root, SITE_JSON)} — nothing to compile`,
  );
  process.exit(1);
}

if (dev) {
  const rest = args.slice(1).filter((arg) => arg !== "--");
  let stop = () => {};
  if (hasSpec) {
    const renderer = await loadRenderer();
    compile(renderer);
    stop = watchSpec(renderer);
  }
  const child = runNextDev(rest);
  child.on("exit", (code) => {
    stop();
    process.exit(code ?? 0);
  });
} else if (hasSpec) {
  const renderer = await loadRenderer();
  process.exit(compile(renderer) ? 0 : 1);
}
