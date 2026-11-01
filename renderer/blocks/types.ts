/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { z } from 'zod';
import type { BlockVariant, DesignOption, SectionRole } from './design-options';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/**
 * The palette's four shelves: `layout` holds containers and spacing, `blocks`
 * the agnostic primitives (heading, text, image, button…), `interactive` the
 * blocks that read or write a parcours (scope, dates, quantity, choices,
 * steps, summary — M40), `library` the composed, opinionated sections (hero,
 * feature grid, CTA band…) — the set a later milestone splits into system and
 * agency components.
 */
export type BlockCategory = 'layout' | 'blocks' | 'interactive' | 'library';

export type RenderMode = 'static' | 'canvas' | 'preview';

/**
 * What every block reads at render time. Travels as Puck `metadata` (the only
 * channel that reaches a block in a server component, where React context is
 * unavailable) under the `hlSite` key.
 */
export type SiteRenderContext = {
  locale: string;
  dir: 'ltr' | 'rtl';
  mode: RenderMode;
  /** `POST` target of the form block; empty renders the form disabled. */
  formEndpoint: string;
  /**
   * A PREVIEW build's own id, sent as `X-Hlou-Build` with every form post so
   * the submission lands in the portal's Sandbox (decision 90). Absent on a
   * production build — the live site never names itself.
   */
  formBuildId?: string;
  /** Forces one of the theme's two palettes (the Design canvas's toolbar
   *  switch). Absent — every published render — follows the visitor. */
  colorScheme?: 'light' | 'dark';
  /** Client components render as island markers (`render/island.tsx`) for a
   *  page hydrated island by island — the kernel build method. */
  islands?: boolean;
  /**
   * The records base a live collection is read from at runtime
   * (`…/api/v1/public/records/<projectId>/`, CB-04). Absent or empty — the
   * canvas, a draft — a live list draws its frozen records and never fetches.
   */
  recordsEndpoint?: string;
  /** The render's base path (`/fr`, `/p/<slug>/fr?build=…`): a live list
   *  prefixes the root-relative links the records endpoint answers with. */
  basePath?: string;
  /**
   * The site path of the page being drawn (`/`, `/about`, `/rooms/jasmin`),
   * without the base path. A nav marks its link to this page with
   * `aria-current` (`ariaCurrent` in `resolve/href`) as it renders — the same
   * on the canvas, in Preview and in a build, no script.
   */
  currentPath?: string;
  /**
   * The blocks above the fold (M37-06): the page's first node and the
   * first-child chain inside it. Their first media is not lazy-loaded and
   * asks `fetchpriority="high"` (decision 188 §10).
   */
  leadBlocks?: string[];
  /**
   * The canvas draws what a block keeps behind a click — a header's menu
   * panel — inline under it, so a designer can style it (M40-11). Only a
   * component frame asks; pages never do.
   */
  previewOverlays?: boolean;
};

export const DEFAULT_RENDER_CONTEXT: SiteRenderContext = {
  locale: 'fr',
  dir: 'ltr',
  mode: 'static',
  formEndpoint: '',
};

export const RENDER_CONTEXT_METADATA_KEY = 'hlSite';

/** Where `SiteRender` (and the Design canvas) put the theme in Puck metadata. */
export const THEME_METADATA_KEY = 'hlTheme';
/** Where `SiteRender` puts `snapshot.settings.attribution` — only outside the
 *  canvas, and only when the badge is on. Absent = no badge. */
export const ATTRIBUTION_METADATA_KEY = 'hlAttribution';
/** The node id of the Footer block whose legal row carries the badge
 *  (`attributionFooter`). Absent with the badge on = `SiteRoot`'s own row. */
export const ATTRIBUTION_FOOTER_METADATA_KEY = 'hlAttributionFooter';

/** Puck adds `id` and `puck` to every component's props. */
export type BlockProps<P> = P & { id: string; puck?: unknown };

export interface BlockDefinition<S extends z.ZodObject = z.ZodObject, P = z.infer<S>> {
  key: string;
  /** A stable KEY, equal to `key` — consumers translate it (`Design.blocks.<key>`); it is never shown raw. */
  label: string;
  category: BlockCategory;
  /** Stored props — what the composition contains before resolution. */
  schema: S;
  defaults: z.infer<S>;
  /**
   * Method syntax on purpose: a block typed on its own resolved props must fit
   * the registry's `Record<BlockKey, BlockDefinition>` without a cast.
   */
  Component(props: BlockProps<P>): ReactElement;
  /** Prop names that accept `{ $slot }` / `{ $record }`. */
  bindable: string[];
  /** Prop names that accept `{ $collection }`. */
  collectionProps?: string[];
  /** Prop names that accept `{ $form }`. */
  formProps?: string[];
  /**
   * The semantic layer (M33-13), declared by every library block in its
   * `design.ts`: what the section is for, the layouts it comes in, and its
   * one-click looks. `design.ts` (the folder's) applies them at render time.
   */
  role?: SectionRole;
  variants?: Array<BlockVariant<z.infer<S>>>;
  designOptions?: Array<DesignOption<z.infer<S>>>;
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Narrow Puck's `puck.metadata.hlSite` to a `SiteRenderContext`; anything
 * missing falls back to the defaults so a block rendered outside `SiteRender`
 * (a Puck preview with no metadata) still paints.
 */
export function readRenderContext(puck: unknown): SiteRenderContext {
  if (!isRecord(puck) || !isRecord(puck.metadata)) return DEFAULT_RENDER_CONTEXT;
  const raw = puck.metadata[RENDER_CONTEXT_METADATA_KEY];
  if (!isRecord(raw)) return DEFAULT_RENDER_CONTEXT;
  const mode = raw.mode;
  return {
    locale: typeof raw.locale === 'string' ? raw.locale : DEFAULT_RENDER_CONTEXT.locale,
    dir: raw.dir === 'rtl' ? 'rtl' : 'ltr',
    mode: mode === 'canvas' || mode === 'preview' || mode === 'static' ? mode : 'static',
    formEndpoint: typeof raw.formEndpoint === 'string' ? raw.formEndpoint : '',
    ...(typeof raw.formBuildId === 'string' && raw.formBuildId
      ? { formBuildId: raw.formBuildId }
      : {}),
    ...(raw.colorScheme === 'light' || raw.colorScheme === 'dark'
      ? { colorScheme: raw.colorScheme }
      : {}),
    ...(raw.islands === true ? { islands: true } : {}),
    ...(typeof raw.recordsEndpoint === 'string' && raw.recordsEndpoint
      ? { recordsEndpoint: raw.recordsEndpoint }
      : {}),
    ...(typeof raw.basePath === 'string' && raw.basePath ? { basePath: raw.basePath } : {}),
    ...(typeof raw.currentPath === 'string' && raw.currentPath.startsWith('/')
      ? { currentPath: raw.currentPath }
      : {}),
    ...(Array.isArray(raw.leadBlocks)
      ? { leadBlocks: raw.leadBlocks.filter((id): id is string => typeof id === 'string') }
      : {}),
    ...(raw.previewOverlays === true ? { previewOverlays: true } : {}),
  };
}
