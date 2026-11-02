/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CSSProperties, ReactElement, ReactNode } from 'react';
import type { ColorValue } from './style-props';
import { resolveColorValue, styleVars } from './shared';
import { cx } from './tw';

/* -------------------------------------------------------------------------- */
/*                                   SHAPES                                   */
/* -------------------------------------------------------------------------- */

/**
 * Marked words: a heading or a statement names the words to set apart
 * (`accentWords`), and how — a colour through the `accent` element's style,
 * and a DECORATION drawn around or under the word: a hand-drawn ellipse, a
 * scribble, an underline, a highlight. A hero that circles one word; this
 * is that, without code.
 */
export const ACCENT_DECORATIONS = [
  'none',
  'underline',
  'ellipse',
  'highlight',
  'scribble',
] as const;
export type AccentDecoration = (typeof ACCENT_DECORATIONS)[number];

/** Hand-drawn strokes on a stretchable box (`preserveAspectRatio="none"`). */
const SHAPE_PATHS: Partial<Record<AccentDecoration, { viewBox: string; d: string }>> = {
  ellipse: {
    viewBox: '0 0 200 80',
    d: 'M 18 44 C 14 20, 62 5, 106 6 C 158 7, 196 22, 192 44 C 188 66, 128 77, 90 75 C 50 73, 8 60, 14 40 C 18 30, 34 24, 48 22',
  },
  scribble: {
    viewBox: '0 0 200 80',
    d: 'M 6 62 C 40 52, 80 70, 118 60 S 170 50, 194 62 M 12 70 C 60 60, 110 78, 190 68',
  },
  underline: {
    viewBox: '0 0 200 10',
    d: 'M 2 7 Q 100 1 198 6',
  },
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

function normalise(word: string): string {
  return word
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .toLowerCase();
}

/**
 * `text` with its accent words wrapped. `accent` carries the span's classes,
 * inline style and canvas marker (the `accent` element); the decoration's
 * colour defaults to the theme accent. Whole words only, accents and case
 * ignored: "Vibe" marks "vibe," too.
 */
export function AccentText({
  text,
  words,
  decoration = 'none',
  color,
  accent,
}: {
  text: string;
  words: readonly string[];
  decoration?: AccentDecoration;
  color?: ColorValue;
  accent: { className?: string; style?: CSSProperties; 'data-hl-field'?: string };
}): ReactElement {
  const wanted = new Set(words.map(normalise).filter(Boolean));
  if (wanted.size === 0) return <>{text}</>;
  const shape = SHAPE_PATHS[decoration];
  const colour = color ? resolveColorValue(color, '--site-accent') : undefined;
  const vars = styleVars({ '--site-mark-color': colour });
  const out: ReactNode[] = [];
  text.split(/(\s+)/).forEach((part, index) => {
    if (!part || /^\s+$/.test(part) || !wanted.has(normalise(part))) {
      out.push(part);
      return;
    }
    out.push(
      <span
        key={index}
        className={cx(
          'hl-accent',
          decoration !== 'none' && `hl-accent--${decoration}`,
          accent.className
        )}
        style={{ ...vars, ...accent.style }}
        data-hl-field={accent['data-hl-field']}
      >
        {part}
        {shape ? (
          <svg
            className="hl-accent__shape"
            viewBox={shape.viewBox}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d={shape.d} vectorEffect="non-scaling-stroke" />
          </svg>
        ) : null}
      </span>
    );
  });
  return <>{out}</>;
}
