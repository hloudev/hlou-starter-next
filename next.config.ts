import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // A fully static site: every page is in out/ as <path>/index.html.
  output: "export",
  trailingSlash: true,
  // Next's build ID is random per build, and it is the only thing that differs
  // between a cold build and one with a warm .next/cache. The Hlou builder pins
  // it to the site version (HLOU_BUILD_ID), so rebuilding a version is
  // byte-identical and unchanged _next/static files are not re-uploaded.
  // Not NEXT_PUBLIC_HLOU_BUILD_ID, which is the build row a preview's forms send.
  generateBuildId: async () => process.env.HLOU_BUILD_ID ?? "hlou",
  // The builder sets HLOU_SKIP_TYPECHECK=1 when a version carries no
  // hand-edited code: everything else here is Hlou's and type-checked before it
  // ships, and the check is about a second of a warm build. With edits it runs.
  typescript: {
    ignoreBuildErrors: process.env.HLOU_SKIP_TYPECHECK === "1",
  },
  images: {
    unoptimized: true,
  },
  // The site may sit inside another pnpm workspace; pin the root here so
  // Turbopack never picks the outer one up.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default withNextIntl(nextConfig);
