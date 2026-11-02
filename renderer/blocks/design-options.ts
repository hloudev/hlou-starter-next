/* -------------------------------------------------------------------------- */
/*                                   PURPOSE                                  */
/* -------------------------------------------------------------------------- */

/**
 * The semantic layer over a block's typed values: what a section is
 * FOR (its role), the layouts it comes in (variants) and the few one-click
 * looks it offers (design options). Everything here compiles to the props
 * and the typed style a block already has — no new component,
 * no class outside the vocabulary.
 *
 * Types and the shared option builders only: each library block declares its
 * own set in `<key>/design.ts`, and `design.ts` applies them at render time.
 */

import type { BoxStyle } from './style-props';

import { SITE_SCHEME_KEY } from '../contracts/guards';

/* -------------------------------------------------------------------------- */
/*                                    ROLES                                   */
/* -------------------------------------------------------------------------- */

/**
 * What a section is for. Structure's patterns map onto these, the Insert
 * list groups by them, and `list_variants(role)` answers by them.
 */
export const SECTION_ROLES = [
  'header',
  'hero',
  'features',
  'stats',
  'logos',
  'quote',
  'faq',
  'cta',
  'news',
  'listing',
  'gallery',
  'contact',
  'content',
  'footer',
] as const;
export type SectionRole = (typeof SECTION_ROLES)[number];

export function isSectionRole(value: unknown): value is SectionRole {
  return typeof value === 'string' && (SECTION_ROLES as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** A style layer: the block's own box, and its named elements. */
export interface DesignLayer {
  style?: BoxStyle;
  elements?: Record<string, BoxStyle>;
}

/**
 * One value of a design option. `props` presets the block's own props (a
 * column count); `apply` derives them from the props when the preset depends
 * on them (method syntax, so a block typed on its own props fits the
 * registry). Style lands under the node's explicit style.
 */
export interface DesignChoice<P = Record<string, unknown>> extends DesignLayer {
  value: string;
  /** `Design.designOptions.<option>.<value>`. */
  labelKey: string;
  props?: Partial<P>;
  apply?(props: P): Partial<P>;
}

export interface DesignOption<P = Record<string, unknown>> {
  /** `container`, `columns`, `density`, `cards`, `align`. */
  key: string;
  /** `Design.designOptions.<key>.label`. */
  labelKey: string;
  choices: Array<DesignChoice<P>>;
}

/**
 * One layout of a block: a preset of its existing props (written into the
 * node when the variant is picked), plus default design choices and a style
 * layer, both below what the node sets itself. `thumbnail` is a Structure
 * wireframe glyph key, which draws it in
 * Wireframe and in the Insert list — a plain string here, because the
 * renderer imports nothing of Hlou's; `feature-design` checks every one.
 */
export interface BlockVariant<P = Record<string, unknown>> extends DesignLayer {
  key: string;
  /** `Design.variants.<block>.<key>`. */
  labelKey: string;
  design?: Record<string, string>;
  props?: Partial<P>;
  thumbnail: string;
}

/** A library block's semantic layer, as its `design.ts` declares it. */
export interface BlockDesign<P = Record<string, unknown>> {
  role: SectionRole;
  variants: Array<BlockVariant<P>>;
  designOptions: Array<DesignOption<P>>;
}

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** The colour scheme a section sits on: a theme scheme key, not a registry choice. */
export const SCHEME_DESIGN_KEY = 'scheme';

/** What a stored scheme key may look like before it reaches an attribute or a selector. */
export const SCHEME_KEY_PATTERN = SITE_SCHEME_KEY;

/* -------------------------------------------------------------------------- */
/*                                  BUILDERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Section padding, block axis only, in four steps of the spacing scale —
 * mobile first, a step up from `md`. Every value is a vocabulary step.
 */
const DENSITY_STEPS = {
  s: { base: '8', md: '12' },
  m: { base: '12', md: '16' },
  l: { base: '16', md: '24' },
  xl: { base: '20', md: '32' },
} as const;

export const DENSITY_VALUES = Object.keys(DENSITY_STEPS) as Array<keyof typeof DENSITY_STEPS>;

/** `density`: s / m / l / xl → the section's block padding. */
export function densityOption<P>(): DesignOption<P> {
  return {
    key: 'density',
    labelKey: 'Design.designOptions.density.label',
    choices: DENSITY_VALUES.map((value) => {
      const step = DENSITY_STEPS[value];
      return {
        value,
        labelKey: `Design.designOptions.density.${value}`,
        style: {
          base: { padding: { blockStart: step.base, blockEnd: step.base } },
          md: { padding: { blockStart: step.md, blockEnd: step.md } },
        },
      };
    }),
  };
}

/** A design option whose every choice is one prop's value. */
export function propOption<P, K extends keyof P & string>(
  key: string,
  prop: K,
  values: ReadonlyArray<readonly [value: string, propValue: P[K]]>
): DesignOption<P> {
  return {
    key,
    labelKey: `Design.designOptions.${key}.label`,
    choices: values.map(([value, propValue]) => ({
      value,
      labelKey: `Design.designOptions.${key}.${value}`,
      props: { [prop]: propValue } as unknown as Partial<P>,
    })),
  };
}

/** `align`: the block's own alignment prop, start / center (/ end). */
export function alignOption<P, K extends keyof P & string>(
  prop: K,
  values: ReadonlyArray<P[K] & string>
): DesignOption<P> {
  return propOption<P, K>(
    'align',
    prop,
    values.map((value) => [value, value] as const)
  );
}

/** `columns`: a responsive column count — one column on a phone, `n` from `md`. */
export function responsiveColumnsOption<P, K extends keyof P & string>(
  prop: K,
  counts: readonly number[]
): DesignOption<P> {
  return propOption<P, K>(
    'columns',
    prop,
    counts.map(
      (count) =>
        [
          String(count),
          (count > 3 ? { base: 1, md: 2, lg: count } : { base: 1, md: count }) as P[K],
        ] as const
    )
  );
}

/** `columns`: a plain column count (the feature grid's). */
export function columnsOption<P, K extends keyof P & string>(
  prop: K,
  counts: readonly number[]
): DesignOption<P> {
  return propOption<P, K>(
    'columns',
    prop,
    counts.map((count) => [String(count), count as P[K]] as const)
  );
}

/* -------------------------------------------------------------------------- */
/*                               A NODE'S CHOICES                             */
/* -------------------------------------------------------------------------- */

/** The node fields a block receives in Puck and from `renderDoc` (`DOC_SIDE_MAP_PROP`). */
const SIDE_MAP_PROP = '__hl';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** A node's variant and design choices, read from the props its block is handed. */
export function readNodeDesign(props: unknown): {
  variant?: string;
  design?: Record<string, string>;
} {
  const side = asRecord(asRecord(props)?.[SIDE_MAP_PROP]);
  if (!side) return {};
  const design = asRecord(side.design);
  const choices: Record<string, string> = {};
  for (const [key, value] of Object.entries(design ?? {})) {
    if (typeof value === 'string') choices[key] = value;
  }
  return {
    ...(typeof side.variant === 'string' ? { variant: side.variant } : {}),
    ...(Object.keys(choices).length > 0 ? { design: choices } : {}),
  };
}

/** The colour scheme a block sits on (`design.scheme`), when it is a key a selector can carry. */
export function schemeOf(props: unknown): string | undefined {
  const scheme = readNodeDesign(props).design?.[SCHEME_DESIGN_KEY];
  return scheme && SCHEME_KEY_PATTERN.test(scheme) ? scheme : undefined;
}
