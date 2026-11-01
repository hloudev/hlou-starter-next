import { defineRouting } from "next-intl/routing";
import snapshot from "@/site/snapshot.json";

/**
 * Locales come from the generated snapshot, so a materialised site never
 * needs a code change per project. `snapshot.json` is read directly here
 * (not through `lib/snapshot.ts`) because next-intl's navigation helpers can
 * run in client components, where `server-only` modules are off limits.
 */
type Dir = "ltr" | "rtl";

const localeInfos = snapshot.locales as Array<{
  code: string;
  isSource: boolean;
  dir: Dir;
}>;

const codes = localeInfos.map((locale) => locale.code);
const source = localeInfos.find((locale) => locale.isSource) ?? localeInfos[0];

export const routing = defineRouting({
  locales: codes,
  defaultLocale: source?.code ?? "fr",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const rtlLocales: string[] = localeInfos
  .filter((locale) => locale.dir === "rtl")
  .map((locale) => locale.code);

export function getDir(locale: string): Dir {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}

export function isLocale(value: string): value is Locale {
  return routing.locales.includes(value);
}
