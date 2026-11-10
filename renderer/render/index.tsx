/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { RenderMode, SiteRenderContext } from '../blocks/types';
import type { SiteRenderConfig } from '../config';
import type { PageDocV2, RecordDoc, SiteSnapshot } from '../contracts';
import type { PageDocument } from '../doc/schema';
import type { ScopeSnapshot } from '../state/schema';
import { Island } from './island';
import { RENDER_CONTEXT_METADATA_KEY } from '../blocks/types';

import {
  ATTRIBUTION_FOOTER_METADATA_KEY,
  ATTRIBUTION_METADATA_KEY,
  getSiteConfig,
  SITE_MEDIA_METADATA_KEY,
  THEME_METADATA_KEY,
} from '../config';
import { recordsEndpointFromFormEndpoint, themeMotion } from '../contracts';
import { renderDoc } from '../doc/render';
import { ROOT_SLOT } from '../doc/schema';
import { childrenOf, slotsOf, subtreeIds } from '../doc/tree';
import { motionOrigins } from '../motion/bridge';
import { hasMotion } from '../motion/compile';
import { resolveDoc } from '../resolve';
import { attributionFooter } from '../site/attribution-footer';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type SiteRenderProps = {
  snapshot: SiteSnapshot;
  /** One of its pages, or a page drawn against it (a draft, a frame). */
  page: PageDocV2;
  locale: string;
  /** `static` (published, default) · `canvas` (Design) · `preview` (stage). */
  mode?: RenderMode;
  /** The current record on a `collection_template` page. */
  record?: RecordDoc;
  /** Render the Header / Footer instances around the page. */
  chrome?: boolean;
  /** `POST` target of the form block. Empty → the form renders disabled. */
  formEndpoint?: string;
  /**
   * The records base a live collection reads at runtime (CB-04). Defaults to
   * `recordsEndpointFromFormEndpoint(formEndpoint)`, so every method that
   * passes a form base reads live lists too; empty → no runtime read.
   */
  recordsEndpoint?: string;
  /** Prefixed to hrefs derived from a page id (`/fr`). */
  basePath?: string;
  /** A config from `createSiteConfig` with overrides; defaults to the mode's. */
  config?: SiteRenderConfig;
  /** The build row a preview's forms name (`X-Hlou-Build`); unset in production. */
  formBuildId?: string;
  /** Render client components as island markers, hydrated one by one (kernel). */
  islands?: boolean;
  /** The Canvas editor's node, slot and owner markers (`renderDoc`'s `markers`). */
  markers?: boolean;
  /**
   * The Canvas state bar's preview, by scope id: merged over
   * each scope's first state. Only the canvas passes it.
   */
  previewState?: Record<string, Partial<ScopeSnapshot>>;
  /** Draw a block's hidden overlays inline (a header's menu panel): a component frame. */
  previewOverlays?: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/** The block a section planned in Structure is. */
const PLANNED_SECTION_TYPE = 'section';

/**
 * A published site never shows a Structure section nobody has designed yet:
 * a planned `section` block (one that names its Structure section) holding
 * nothing is left out in `static` mode. The canvas and the preview draw it
 * as the planned section. Any other node linked to a section is its design.
 */
function withoutEmptyPlannedSections(doc: PageDocument): PageDocument {
  const planned = childrenOf(doc, doc.root, ROOT_SLOT).filter(
    (node) =>
      node.type === PLANNED_SECTION_TYPE &&
      node.section !== undefined &&
      slotsOf(doc, node.id).length === 0
  );
  if (planned.length === 0) return doc;
  const gone = new Set(planned.flatMap((node) => subtreeIds(doc, node.id)));
  return {
    ...doc,
    nodes: Object.fromEntries(Object.entries(doc.nodes).filter(([id]) => !gone.has(id))),
  };
}

/**
 * The blocks above the fold: the page's first node, then its first
 * child, and so on down — a hero, or a section whose first block is an
 * image. A Header instance is not the page: the page's own first node is.
 */
export function leadBlockIds(doc: PageDocument): string[] {
  const ids: string[] = [];
  let parent = doc.root;
  for (let depth = 0; depth < 8; depth += 1) {
    const slots = depth === 0 ? [ROOT_SLOT] : slotsOf(doc, parent);
    const first = slots.length > 0 ? childrenOf(doc, parent, slots[0]!)[0] : undefined;
    if (!first) break;
    ids.push(first.id);
    parent = first.id;
  }
  return ids;
}

/**
 * The site path a page is drawn at: its own path, or a template's with the
 * record's slug in place of `[slug]` (`/rooms/[slug]` → `/rooms/jasmin`), as
 * `resolve` builds a record's link.
 */
export function currentPathOf(page: SiteRenderProps['page'], record?: RecordDoc): string {
  return record?.slug ? page.path.replace(/\[slug\]/g, encodeURIComponent(record.slug)) : page.path;
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * The one render path: the page document, with its Header and Footer
 * instances, through `renderDoc` and the registry-generated config. No hooks,
 * no context — the render context and the theme travel as `metadata`, so
 * this works as a React Server Component and in a static export alike.
 */
export function SiteRender({
  snapshot,
  page,
  locale,
  mode = 'static',
  record,
  chrome = true,
  formEndpoint = '',
  recordsEndpoint,
  basePath,
  config,
  formBuildId,
  islands = false,
  markers = false,
  previewState,
  previewOverlays = false,
}: SiteRenderProps): ReactElement {
  const { components } = snapshot;
  const resolved = resolveDoc({
    snapshot,
    doc: mode === 'static' ? withoutEmptyPlannedSections(page.doc) : page.doc,
    locale,
    record,
    basePath,
  });
  /* Components resolve without the record: they are the same on every page. */
  const drawn = components.flatMap((component) =>
    !chrome && (component.kind === 'header' || component.kind === 'footer')
      ? []
      : [{ ...component, doc: resolveDoc({ snapshot, doc: component.doc, locale, basePath }).doc }]
  );

  const records = recordsEndpoint ?? recordsEndpointFromFormEndpoint(formEndpoint);
  const context: SiteRenderContext = {
    locale: resolved.locale,
    dir: resolved.dir,
    mode,
    formEndpoint,
    ...(records ? { recordsEndpoint: records } : {}),
    ...(basePath ? { basePath } : {}),
    currentPath: currentPathOf(page, record),
    ...(formBuildId ? { formBuildId } : {}),
    ...(islands ? { islands } : {}),
    ...(previewOverlays && mode === 'canvas' ? { previewOverlays } : {}),
    leadBlocks: leadBlockIds(resolved.doc),
    /* The palette the version was frozen in pins the scope — every surface
       that renders a build shows it as built, whatever the viewer's system. */
    ...(snapshot.colorScheme ? { colorScheme: snapshot.colorScheme } : {}),
  };

  /* The badge shows in the preview and on the published site, never in the
     Design canvas (every Canvas path passes `mode="canvas"`). It closes the
     legal row of the first Footer the page draws; with no visible footer
     (none, hidden, or `chrome` off) `SiteRoot` draws it in a row of its own
. */
  const attribution = snapshot.settings.attribution;
  const showAttribution = mode !== 'canvas' && attribution?.enabled === true;
  const footer =
    showAttribution && attribution.mode !== 'float'
      ? attributionFooter(resolved.doc, drawn, chrome)
      : null;

  const drawnPage = renderDoc({
    doc: resolved.doc,
    components: drawn,
    config: config ?? getSiteConfig(mode),
    chrome,
    markers,
    previewState,
    metadata: {
      [RENDER_CONTEXT_METADATA_KEY]: context,
      [THEME_METADATA_KEY]: snapshot.theme,
      [SITE_MEDIA_METADATA_KEY]: snapshot.media,
      ...(showAttribution ? { [ATTRIBUTION_METADATA_KEY]: attribution } : {}),
      ...(footer ? { [ATTRIBUTION_FOOTER_METADATA_KEY]: footer.id } : {}),
    },
  });

  /* The motion runtime (M47, decision 319): one island at the end of a page
     that carries motion — its own or its components'. A page without any
     ships no motion code. Never in the canvas, which runs its own (MO5). */
  if (mode === 'canvas' || !hasMotion(resolved.doc, drawn)) return drawnPage;
  const origins = motionOrigins(formEndpoint, records);
  return (
    <>
      {drawnPage}
      <Island
        name="motion"
        props={{
          personality: themeMotion(snapshot.theme),
          dir: resolved.dir,
          /* Who may replay it from Preview by message (M47-07): the control plane. */
          ...(origins.length > 0 ? { origins } : {}),
        }}
        markers={islands}
      />
    </>
  );
}
