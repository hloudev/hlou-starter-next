/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement, ReactNode } from 'react';
import type { ResolvedCollection, ResolvedRecord } from '../contracts';
import type { DocScopeEnv } from '../doc/render';
import type { ScopeDefField } from '../state/schema';
import type { WidgetImage, WidgetStyled } from './widget-client';
import { ICON_PATHS, isIconName } from './icon-paths';
import { mediaImgAttrs } from './media';

import { isResolvedMedia } from '../contracts';
import { formatState } from '../state/format';
import { pathKey } from '../state/when';

/* The server half of the scope widgets (quantity, choiceCards, steps,
   summary): what a block's shell reads of the scope it sits in, shaped into
   the plain JSON its island renders from. The island half is
   `widget-client.tsx`, which never imports this file (zod, the contracts). */

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * The scope a block sits in, as the render pass handed it (`__hl.scope`:
 * its id, def and render-time snapshot), or `null` outside any scope.
 */
export function widgetScope(props: unknown): DocScopeEnv | null {
  const side = asRecord(asRecord(props)?.__hl);
  const scope = asRecord(side?.scope);
  if (!scope || typeof scope.id !== 'string' || !asRecord(scope.def)) return null;
  return scope as unknown as DocScopeEnv;
}

/** The scope field a path names (its first segment), or `undefined`. */
export function widgetField(scope: DocScopeEnv, path: string): ScopeDefField | undefined {
  const key = pathKey(path);
  return scope.def.fields.find((field) => field.key === key);
}

/** A price in the scope currency's minor units, formatted; `undefined` when there is none. */
export function widgetPrice(
  scope: DocScopeEnv,
  price: number | null | undefined,
  locale: string
): string | undefined {
  if (typeof price !== 'number') return undefined;
  return formatState(price, 'currency', { locale, currency: scope.def.currency });
}

/** An icon name's path data, for an island that cannot import the icon set. */
export function iconPaths(name: string): string[] {
  return isIconName(name) ? [...(ICON_PATHS[name] ?? [])] : [];
}

/** A media value as an island's `<img>` attributes (`mediaImgAttrs`, lazy). */
export function widgetImage(value: unknown, sizes: string): WidgetImage | undefined {
  if (!isResolvedMedia(value)) return undefined;
  const { reducedMotionSrc: _still, ...attrs } = mediaImgAttrs(value, { sizes });
  return { ...attrs, alt: value.alt ?? '' };
}

/** An element's styles (`blockParts().el`) as island props: JSON only. */
export function widgetStyled(styled: {
  className: string;
  style?: object;
  'data-hl-field'?: string;
  'data-hl-motion'?: string;
}): WidgetStyled {
  return {
    className: styled.className,
    ...(styled.style ? { style: styled.style as Record<string, string> } : {}),
    ...(styled['data-hl-field'] ? { 'data-hl-field': styled['data-hl-field'] } : {}),
    /* Its motion: the island spreads it, the page runtime plays it. */
    ...(styled['data-hl-motion'] ? { 'data-hl-motion': styled['data-hl-motion'] } : {}),
  };
}

/**
 * The records of a widget's own `source` (the presentation collection), by
 * id: what joins a catalog entry to its photo, icon or meta.
 */
export function recordsById(source: unknown): Map<string, ResolvedRecord> {
  const collection = asRecord(source) as ResolvedCollection | null;
  if (collection?.$resolved !== 'collection' || !Array.isArray(collection.records)) {
    return new Map();
  }
  return new Map(collection.records.map((record) => [record.id, record]));
}

/** A record field as text (a string or a number), else `undefined`. */
export function recordText(record: ResolvedRecord | undefined, key: string): string | undefined {
  if (!record || !key) return undefined;
  const value = record.data[key];
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

/**
 * A record's presentation through an `optionMapping`: its icon (a field
 * holding an icon name, or an SVG / image asset), its image, its meta.
 */
export function recordPresentation(
  record: ResolvedRecord | undefined,
  mapping: { imageField?: string; metaField?: string; iconField?: string } | undefined,
  sizes: string
): { icon?: string[]; image?: WidgetImage; meta?: string } {
  if (!record || !mapping) return {};
  const iconValue = mapping.iconField ? record.data[mapping.iconField] : undefined;
  const icon = typeof iconValue === 'string' ? iconPaths(iconValue) : [];
  const iconImage = icon.length === 0 ? widgetImage(iconValue, sizes) : undefined;
  const image =
    iconImage ??
    (mapping.imageField ? widgetImage(record.data[mapping.imageField], sizes) : undefined);
  const meta = recordText(record, mapping.metaField ?? '');
  return {
    ...(icon.length > 0 ? { icon } : {}),
    ...(image ? { image } : {}),
    ...(meta ? { meta } : {}),
  };
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

/**
 * A widget the editor cannot draw from a scope — unbound, outside a scope,
 * bound to a path of the wrong type, a scope without steps: a dashed frame,
 * the badge (« Non lié », « Aucune étape ») and a placeholder. Never on the
 * published site.
 */
export function WidgetUnbound({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="hl-widget-unbound relative rounded-site border border-dashed border-site-hairline-strong p-3">
      <span className="mb-2 inline-flex rounded-site-pill bg-site-well px-2 py-0.5 font-mono text-[10px] tracking-[0.06em] text-site-ink-soft uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}
