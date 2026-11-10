/*
 * THE OLD MOTION SHAPE, UPGRADED ON READ. Before this spec a style's
 * motion was `{ reveal: fade | fade-up | scale-in, delay: '0'–'3', hover:
 * lift | zoom | dim }`, compiled to CSS classes. Those values live on in page
 * documents and in every frozen `site_versions.snapshot`, so — like
 * `upgradeThemeTokens` — they upgrade where they are read, never by a
 * migration: `motionSchema` is `z.preprocess(upgradeMotion, motionSpecSchema)`.
 *
 * No dependency (not even zod): `blocks/tw.ts` reads it for the deprecated
 * classes, and the editor reads it on raw stored values.
 */

/** Old reveal → appear preset. `none` drops the reveal. */
export const LEGACY_REVEAL_PRESETS = {
  fade: 'fade',
  'fade-up': 'rise',
  'scale-in': 'zoom',
} as const;
/** Old delay step → seconds. */
export const LEGACY_DELAY_SECONDS = { '0': 0, '1': 0.1, '2': 0.2, '3': 0.3 } as const;
/** Old hover → hover preset. `none` drops it. */
export const LEGACY_HOVER_PRESETS = { lift: 'lift', zoom: 'enlarge', dim: 'dim' } as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const own = <T extends object>(table: T, key: unknown): T[keyof T] | undefined =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(table, key)
    ? table[key as keyof T]
    : undefined;

/** Whether a stored motion still carries the old shape (any of its three keys as a string). */
export function isLegacyMotion(value: unknown): boolean {
  return (
    isRecord(value) &&
    (typeof value.reveal === 'string' ||
      typeof value.delay === 'string' ||
      typeof value.hover === 'string')
  );
}

/**
 * An old `{ reveal, delay, hover }` → the current spec: `enter` with the matching
 * preset on `inView`, once, its delay in seconds; `hover` with the matching
 * preset. Anything else passes through untouched — a new spec, a non-object.
 * A value mixing both shapes (an old editor writing over a new spec) keeps
 * its new parts; the old keys win where they overlap. Unknown old values drop.
 */
export function upgradeMotion(value: unknown): unknown {
  if (!isLegacyMotion(value)) return value;
  const legacy = value as Record<string, unknown>;
  const { reveal, delay, hover, ...rest } = legacy;
  const out: Record<string, unknown> = { ...rest };

  const preset = own(LEGACY_REVEAL_PRESETS, reveal);
  if (typeof reveal === 'string' && reveal !== 'none' && preset) {
    const enter = isRecord(rest.enter) ? rest.enter : {};
    const seconds = own(LEGACY_DELAY_SECONDS, delay) ?? 0;
    const transition = isRecord(enter.transition) ? enter.transition : {};
    out.enter = {
      ...enter,
      preset,
      trigger: 'inView',
      once: true,
      ...(seconds > 0 ? { transition: { ...transition, delay: seconds } } : {}),
    };
  } else if (reveal === 'none') {
    delete out.enter;
  }

  if (typeof hover === 'string') {
    /* `none` and unknown values: no hover. */
    const hoverPreset = own(LEGACY_HOVER_PRESETS, hover);
    if (hoverPreset) out.hover = { preset: hoverPreset };
  } else if (hover !== undefined) {
    /* Already the new shape, beside an old reveal. */
    out.hover = hover;
  }
  return out;
}
