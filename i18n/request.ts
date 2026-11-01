import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/* -------------------------------------------------------------------------- */
/*                                  MESSAGES                                  */
/* -------------------------------------------------------------------------- */

type Messages = Record<string, unknown>;

/**
 * `site/messages/<locale>.json` is the flat `{ "site.logo": "…" }` map the
 * builder writes from the site slots. next-intl forbids dots in keys, so the
 * map is unflattened under the `Site` namespace: `t("Site.site.logo")`.
 */
function unflatten(flat: Record<string, unknown>): Messages {
  const out: Messages = {};
  for (const [key, value] of Object.entries(flat)) {
    const segments = key.split(".").filter(Boolean);
    let cursor = out;
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        cursor[segment] = value;
        return;
      }
      const next = cursor[segment];
      if (typeof next === "object" && next !== null) {
        cursor = next as Messages;
      } else {
        const created: Messages = {};
        cursor[segment] = created;
        cursor = created;
      }
    });
  }
  return out;
}

/** The starter's own chrome copy; a locale without a file falls back to the default. */
async function chromeMessages(locale: string): Promise<Messages> {
  try {
    return (await import(`./messages/${locale}.json`)).default as Messages;
  } catch {
    return (await import(`./messages/${routing.defaultLocale}.json`))
      .default as Messages;
  }
}

async function siteMessages(locale: string): Promise<Messages> {
  try {
    const flat = (await import(`../site/messages/${locale}.json`))
      .default as Record<string, unknown>;
    return unflatten(flat);
  } catch {
    return {};
  }
}

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

// Avoid `await requestLocale` — it uses `headers()` and breaks `output: "export"`.
// Use explicit `locale` from next-intl APIs, else default (this app is single-locale).
export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale ?? routing.defaultLocale;

  return {
    locale: resolvedLocale,
    messages: {
      ...(await chromeMessages(resolvedLocale)),
      Site: await siteMessages(resolvedLocale),
    },
  };
});
