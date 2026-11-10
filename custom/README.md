# `custom/` — the user zone

This folder and `app/(custom)/` are yours. **Hlou never generates anything in
these paths**: a Hlou build keeps every file you put here, and the import back
into Hlou accepts them as hand-edited files. Everything new goes here: API
clients, business components, helpers, constants, extra pages.

The rest of the tree belongs to Hlou (see `AGENTS.md` at the root). Three rules
follow from that, and from the site being a **static export**:

- **No server code**: no route handlers, server actions or middleware. Call
  APIs from the browser, with keys that are public by design.
- **No new dependencies, except `motion`**: `package.json` is Hlou's. `fetch`,
  `react`, `zod` and [`motion`](https://motion.dev) (animations, available to
  every site) are there.
- **No env variables**: Hlou's build writes its own `.env.local`. Put public
  configuration in `custom/config.ts`, and never a secret anywhere in the tree.

Import from here with the `@/` alias: `@/custom/api/client`.

## Recipe 1 — a typed API client, used from a `codeVariant`

`custom/config.ts`:

```ts
/** Public by construction: it ships in the page. */
export const AGENCES_API_URL = "https://api.example.com";
```

`custom/api/client.ts`:

```ts
import { z } from "zod";
import { AGENCES_API_URL } from "@/custom/config";

const agenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  phone: z.string(),
});
export type Agence = z.infer<typeof agenceSchema>;

/** `GET /agences`, validated: a changed API fails here, not in a component. */
export async function listAgences(signal?: AbortSignal): Promise<Agence[]> {
  const response = await fetch(`${AGENCES_API_URL}/agences`, {
    headers: { accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`GET /agences answered ${response.status}`);
  return z.array(agenceSchema).parse(await response.json());
}
```

`custom/copy.ts` — the component's own copy, one entry per locale. It is not
Hlou content (no Hlou field holds a loading message), so it lives here, read
with `pick` on the server:

```ts
import { pick, type Locale } from "@/site/content";

const AGENCES = {
  title: { fr: "Nos agences", en: "Our agencies", ar: "وكالاتنا" },
  loading: { fr: "Chargement…", en: "Loading…", ar: "جارٍ التحميل…" },
  error: {
    fr: "Impossible de charger les agences.",
    en: "Could not load the agencies.",
    ar: "تعذّر تحميل الوكالات.",
  },
  empty: {
    fr: "Aucune agence pour le moment.",
    en: "No agencies yet.",
    ar: "لا توجد وكالات حالياً.",
  },
};

export type AgencesCopy = Record<keyof typeof AGENCES, string>;

export function agencesCopy(locale: string): AgencesCopy {
  const text = (key: keyof typeof AGENCES) =>
    pick(AGENCES[key], locale as Locale) ?? "";
  return {
    title: text("title"),
    loading: text("loading"),
    error: text("error"),
    empty: text("empty"),
  };
}
```

`custom/components/AgencesList.tsx` — the data is fetched in the browser, so it
is a client component with its loading, error and empty states. Its labels come
in as props (never import `site/content` into a client component: it would ship
every record to the browser):

```tsx
"use client";

import { useEffect, useState } from "react";
import { listAgences, type Agence } from "@/custom/api/client";
import type { AgencesCopy } from "@/custom/copy";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; agences: Agence[] };

export function AgencesList({ copy }: { copy: AgencesCopy }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    listAgences(controller.signal)
      .then((agences) => setState({ kind: "ready", agences }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ kind: "error" });
      });
    return () => controller.abort();
  }, []);
  if (state.kind === "loading")
    return <p className="text-site-sm text-site-ink-soft">{copy.loading}</p>;
  if (state.kind === "error")
    return <p className="text-site-sm text-site-accent">{copy.error}</p>;
  if (state.agences.length === 0)
    return <p className="text-site-sm">{copy.empty}</p>;
  return (
    <ul className="grid list-none gap-4 p-0 md:grid-cols-3">
      {state.agences.map((agence) => (
        <li
          key={agence.id}
          className="rounded-site border-site-hairline border p-4"
        >
          <h2 className="font-heading text-site-md m-0">{agence.name}</h2>
          <p className="text-site-sm text-site-ink-soft m-0">{agence.city}</p>
        </li>
      ))}
    </ul>
  );
}
```

**Wiring it into a Hlou page** goes through a block variant. In Hlou Design,
put a `custom` block where the list belongs, write its title in Content, and set
its `codeVariant` to `custom:agences`. Here, add the branch to
`renderer/blocks/custom/Component.tsx`, right after the `blockParts` line, and
keep Hlou's default render below it:

```tsx
import { AgencesList } from "@/custom/components/AgencesList";
import { agencesCopy } from "@/custom/copy";
// …
const { root, context, el, item } = blockParts(props, "custom");
if (props.codeVariant === "custom:agences") {
  const title = literal(props.title, "");
  return (
    <section {...root}>
      <div className="max-w-site-content mx-auto w-full">
        {title ? (
          <h2 {...el("title", "mb-6 font-heading text-site-lg")}>{title}</h2>
        ) : null}
        <AgencesList copy={agencesCopy(context.locale)} />
      </div>
    </section>
  );
}
```

The published site runs it from the next build. **Hlou's Design canvas cannot
run it live**: the canvas only resolves `react`, `zod`, `motion` and files
inside `renderer/`, so it shows that block as a code error. When the canvas matters,
keep a variant to markup and put the data-driven part on a page of your own
(recipe 2). `.claude/skills/hlou-code-variant` has the full rules.

## Recipe 2 — a page in `app/(custom)/`, linked from a Hlou page

Pages live under the locale, like Hlou's: `/fr/agences/`, `/en/agences/`,
`/ar/agences/`. Two files.

`app/(custom)/[locale]/layout.tsx` reuses the site's own root layout (theme,
fonts, `<html lang dir>`, analytics), once for every custom page:

```tsx
export {
  default,
  generateMetadata,
  generateStaticParams,
  generateViewport,
} from "@/app/(site)/[locale]/layout";
export const dynamicParams = false;
```

`app/(custom)/[locale]/agences/page.tsx` draws Hlou's Header and Footer around
its own content with `components/SiteFrame`:

```tsx
import { setRequestLocale } from "next-intl/server";
import SiteFrame from "@/components/SiteFrame";
import { AgencesList } from "@/custom/components/AgencesList";
import { agencesCopy } from "@/custom/copy";

export default async function AgencesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const copy = agencesCopy(locale);
  return (
    <SiteFrame locale={locale}>
      <section className="max-w-site-content mx-auto w-full px-6 py-16">
        <h1 className="font-heading text-site-xl mb-8">{copy.title}</h1>
        <AgencesList copy={copy} />
      </section>
    </SiteFrame>
  );
}
```

- **Pick a path no Hlou page uses** (the page paths are in
  `site/snapshot.json` › `pages[].path`). On a shared path Hlou's page wins and
  yours silently disappears from the build.
- **Linking from a Hlou page**: in Hlou Design, give a button or a navigation
  item the literal href `/fr/agences/`. Literal hrefs are not locale-prefixed, so
  write the locale yourself; the unprefixed `/agences/` has no redirect stub and
  answers 404. From your own code, link to `` `/${locale}/agences/` ``.
- The page is not in Hlou's sitemap or navigation until someone adds a link.

## Recipe 3 — a scroll-linked hero with `motion/react`

**First, the spec.** How a block appears, its hover and press, a loop, a
parallax or a text cascade is **data**, not code: `style.motion` on the node in
the page's document, with presets by name (`{ "enter": { "preset": "rise" } }`),
or Hlou Design's Motion tab. One small script plays it on every page, at the
site's own pace, with reduced motion handled. Write Motion code only for what
the spec cannot say, such as a hero whose image drifts and fades as the page
scrolls past it.

`custom/components/ScrollHero.tsx` — a client component on Motion's React
hooks. Its first frame is the complete hero (nothing starts hidden), and a
visitor who asks for reduced motion gets it still:

```tsx
"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

export function ScrollHero({
  media,
  children,
}: {
  media: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);
  return (
    <div ref={ref} className="relative isolate overflow-hidden">
      <motion.div
        className="absolute inset-0 -z-10"
        style={reduce ? undefined : { y, opacity }}
      >
        {media}
      </motion.div>
      {children}
    </div>
  );
}
```

Wire it through a variant of the hero, in `renderer/blocks/hero/Component.tsx`,
right after the `blockParts` line (set `codeVariant: "custom:scroll-hero"` on
the hero in the spec, or in Hlou Design):

```tsx
import { ScrollHero } from "@/custom/components/ScrollHero";
// …
if (props.codeVariant === "custom:scroll-hero") {
  const title = literal(props.title, "");
  return (
    <section {...root}>
      <ScrollHero
        media={
          <MediaFigure
            className="h-full rounded-none"
            media={literalMedia(props.image)}
            sizes="100vw"
            priority
          />
        }
      >
        <div className="max-w-site-content mx-auto flex min-h-[70vh] items-end px-6 py-16">
          <h1 {...el("title", "font-heading text-site-xl m-0")}>{title}</h1>
        </div>
      </ScrollHero>
    </section>
  );
}
```

- **The canvas.** Imported from `@/custom/…`, the variant builds and
  publishes but shows as a code error on Hlou's canvas (recipe 1). To see it
  play there, put `ScrollHero.tsx` beside the block
  (`renderer/blocks/hero/ScrollHero.tsx`) and import it as `./ScrollHero`:
  the canvas hands in `motion` and runs it. That file is then an « edit with
  care » renderer file (`AGENTS.md`).
- **A server component draws `motion.*` elements** from `motion/react-client`
  (`import * as m from "motion/react-client"`) without a `"use client"` file;
  hooks (`useScroll`, `useTransform`, `useReducedMotion`) need one.
- **Never start content hidden** (`initial={{ opacity: 0 }}`): a site Hlou
  builds without Next renders client code once and never runs it, and a
  visitor without JavaScript sees the first frame. Appear effects belong to the
  spec, which keeps content visible either way.
- `motion` only: no other animation package, and no Motion+ APIs.
