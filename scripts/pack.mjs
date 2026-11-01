#!/usr/bin/env node
// Packs this folder into the zip Hlou imports (`pnpm hlou:pack`).
//
//   node scripts/pack.mjs                 check the spec (a new site), then write <name>.hlou.zip here
//   node scripts/pack.mjs --out <file>    write the archive there instead
//   node scripts/pack.mjs --no-check      skip `pnpm hlou:compile` first
//
// What goes in: the spec (`hlou/site/**`, and the lock when there is one),
// `public/media/**`, the user zone (`custom/**`, `app/(custom)/**`) and the
// rest of the tree, under one top-level folder. What stays out: what
// `.gitignore` ignores, `node_modules/`, `.git/`, `.next/`, `out/`, env files
// other than `.env.example`, earlier archives (`*.hlou.zip`), and `site/`
// (compiled from the spec; Hlou compiles its own) — except in a folder
// exported from Hlou, whose import wants every generated file back as it was.
//
// It never writes `hlou/export.json`: a folder without one is a new site, and
// Hlou's wizard (New project › Import) makes a new project from its spec. A
// folder exported from a Hlou project keeps its `hlou/export.json`, and the
// archive goes back through that project's own import.
//
// No dependency: the archive is written with `node:zlib` (deflate, CRC-32).
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateRawSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* ---------------------------------------------------------------------------- */
/*                                   Ignore                                     */
/* ---------------------------------------------------------------------------- */

/** Never packed, wherever they sit. */
const ALWAYS_ANYWHERE = new Set(["node_modules", ".git", ".next", ".DS_Store"]);
/** Never packed at the root: builds. */
const ALWAYS_AT_ROOT = new Set(["out", ".vercel"]);

function isEnvFile(name) {
  return (
    (name === ".env" || name.startsWith(".env.")) && name !== ".env.example"
  );
}

/** A `.gitignore` line as a test on a posix path (dirs end with `/`). */
function gitignoreRule(line) {
  let pattern = line.trim();
  if (!pattern || pattern.startsWith("#")) return null;
  const negate = pattern.startsWith("!");
  if (negate) pattern = pattern.slice(1);
  const dirOnly = pattern.endsWith("/");
  if (dirOnly) pattern = pattern.slice(0, -1);
  const anchored = pattern.startsWith("/") || pattern.includes("/");
  if (pattern.startsWith("/")) pattern = pattern.slice(1);
  let source = "";
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === "*" && pattern[i + 1] === "*") {
      source += ".*";
      i += 1;
      if (pattern[i + 1] === "/") i += 1;
    } else if (char === "*") source += "[^/]*";
    else if (char === "?") source += "[^/]";
    else source += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  const regex = new RegExp(`${anchored ? "^" : "(?:^|/)"}${source}$`);
  return { negate, dirOnly, regex };
}

function loadGitignore() {
  const file = join(root, ".gitignore");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map(gitignoreRule)
    .filter(Boolean);
}

/** The last matching rule decides, as in git (root `.gitignore` only). */
function ignoredByGit(rules, path, isDir) {
  let ignored = false;
  for (const rule of rules) {
    if (rule.dirOnly && !isDir) continue;
    if (rule.regex.test(path)) ignored = !rule.negate;
  }
  return ignored;
}

/** Every file to pack, by posix path from the root, sorted. */
export function packedFiles({
  rules = loadGitignore(),
  keepSite = false,
} = {}) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      const path = relative(root, full).split(sep).join("/");
      const stat = statSync(full, { throwIfNoEntry: false });
      if (!stat) continue;
      const isDir = stat.isDirectory();
      if (ALWAYS_ANYWHERE.has(name)) continue;
      if (!path.includes("/") && ALWAYS_AT_ROOT.has(name) && isDir) continue;
      if (path === "site" && isDir && !keepSite) continue;
      if (!isDir && (isEnvFile(name) || name.endsWith(".hlou.zip"))) continue;
      if (ignoredByGit(rules, path, isDir)) continue;
      if (isDir) walk(full);
      else if (stat.isFile()) out.push(path);
    }
  };
  walk(root);
  return out;
}

/* ---------------------------------------------------------------------------- */
/*                                     Zip                                      */
/* ---------------------------------------------------------------------------- */

/** MS-DOS time and date of `when` (local time, as archivers write it). */
function dosTime(when) {
  const year = Math.max(when.getFullYear(), 1980);
  return {
    time:
      (when.getHours() << 11) |
      (when.getMinutes() << 5) |
      Math.floor(when.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((when.getMonth() + 1) << 5) | when.getDate(),
  };
}

/** A plain zip (deflate or stored, UTF-8 names, no zip64) of `entries`. */
export function zip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, body, modified } of entries) {
    const nameBytes = Buffer.from(name, "utf8");
    const deflated = deflateRawSync(body, { level: 9 });
    const stored = deflated.length >= body.length;
    const data = stored ? body : deflated;
    const crc = crc32(body) >>> 0;
    const { time, date } = dosTime(modified);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(stored ? 0 : 8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(body.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBytes, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4); // made by: unix
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(stored ? 0 : 8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(body.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(((0o100644 << 16) >>> 0) >>> 0, 38); // a regular file
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBytes);

    offset += local.length + nameBytes.length + data.length;
    if (offset > 0xffffffff) throw new Error("the archive is over 4 GB");
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  if (entries.length > 0xffff) throw new Error("more than 65535 files");
  return Buffer.concat([...locals, directory, end]);
}

/* ---------------------------------------------------------------------------- */
/*                                     Main                                     */
/* ---------------------------------------------------------------------------- */

function folderName() {
  try {
    const name = JSON.parse(
      readFileSync(join(root, "package.json"), "utf8"),
    ).name;
    if (typeof name === "string" && /^[a-z0-9][a-z0-9._-]*$/.test(name))
      return name;
  } catch {
    /* no package.json name: the folder's */
  }
  return basename(root).replace(/[^A-Za-z0-9._-]+/g, "-") || "site";
}

function main(args) {
  const outIndex = args.indexOf("--out");
  const name = folderName();
  const out = resolve(
    outIndex >= 0 ? args[outIndex + 1] : join(root, `${name}.hlou.zip`),
  );

  const hasSpec = existsSync(join(root, "hlou", "site", "site.json"));
  const hasExport = existsSync(join(root, "hlou", "export.json"));
  if (!hasSpec && !hasExport) {
    console.error(
      "hlou:pack: no hlou/site/site.json — there is no site spec to import. " +
        "Start one with `npm create hlou-site@latest`, or export the project from Hlou.",
    );
    return 1;
  }

  /* The check compiles into `site/`: in an exported tree that would make every
     generated file a change its import refuses, so it is left as it is. */
  if (hasSpec && !hasExport && !args.includes("--no-check")) {
    const check = spawnSync(
      process.execPath,
      [join(root, "scripts", "spec-build.mjs")],
      {
        cwd: root,
        stdio: "inherit",
      },
    );
    if (check.status !== 0) {
      console.error(
        "hlou:pack: fix the spec first — Hlou would refuse it the same way.",
      );
      return 1;
    }
  }

  /* An exported tree keeps `site/`: its import reads a missing generated file
     as deleted, and refuses it. A new site's is only the local compile. */
  const files = packedFiles({ keepSite: hasExport });
  const entries = files.map((path) => {
    const full = join(root, path);
    return {
      name: `${name}/${path}`,
      body: readFileSync(full),
      modified: statSync(full).mtime,
    };
  });
  const archive = zip(entries);
  writeFileSync(out, archive);

  const media = files.filter((path) => path.startsWith("public/media/")).length;
  const spec = files.filter((path) => path.startsWith("hlou/site/")).length;
  console.log(
    `hlou:pack: ${relative(process.cwd(), out) || out} — ${files.length} files ` +
      `(${spec} in hlou/site/, ${media} in public/media/), ${(archive.length / 1024).toFixed(0)} KB`,
  );
  console.log(
    hasExport
      ? "Import it into its project: Settings › Export and import › Import into this project."
      : "Import it into Hlou: New project › Import, then drop the archive. Hlou shows what it will create first.",
  );
  return 0;
}

/* Run, not imported. Through a symlinked folder (`/var` → `/private/var`), too. */
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exit(main(process.argv.slice(2)));
}
