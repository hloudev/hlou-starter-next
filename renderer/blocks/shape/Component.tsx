/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { ShapeProps } from './schema';
import { shapeDefaults } from './defaults';

import { blockParts, cssNumber, resolveColorValue, styleVars } from '../shared';

/* -------------------------------------------------------------------------- */
/*                                   PATHS                                    */
/* -------------------------------------------------------------------------- */

/** Each shape on a 200×100 box; `clean` is geometric, `hand` wobbles. */
const PATHS: Record<ShapeProps['kind'], { clean: string; hand: string; closed: boolean }> = {
  ellipse: {
    clean:
      'M 100 4 C 160 4, 196 24, 196 50 C 196 76, 160 96, 100 96 C 40 96, 4 76, 4 50 C 4 24, 40 4, 100 4 Z',
    hand: 'M 18 54 C 12 24, 60 5, 106 6 C 158 7, 196 22, 192 50 C 188 78, 128 97, 88 95 C 48 93, 6 76, 14 46 C 18 34, 36 26, 52 22',
    closed: false,
  },
  circle: {
    clean: 'M 100 4 A 46 46 0 1 1 100 96 A 46 46 0 1 1 100 4 Z',
    hand: 'M 104 6 C 150 4, 196 30, 194 54 C 192 80, 150 98, 100 96 C 52 94, 6 74, 8 48 C 10 22, 54 8, 96 6',
    closed: false,
  },
  line: {
    clean: 'M 4 50 L 196 50',
    hand: 'M 4 52 C 60 46, 130 56, 196 48',
    closed: false,
  },
  underline: {
    clean: 'M 4 60 Q 100 36 196 60',
    hand: 'M 6 62 C 50 44, 90 70, 130 56 S 180 44, 196 60',
    closed: false,
  },
  scribble: {
    clean:
      'M 4 50 L 24 30 L 44 70 L 64 30 L 84 70 L 104 30 L 124 70 L 144 30 L 164 70 L 184 30 L 196 50',
    hand: 'M 6 56 C 30 36, 44 70, 68 52 S 110 30, 130 56 S 170 74, 194 48 M 10 74 C 60 60, 120 86, 192 66',
    closed: false,
  },
  arrow: {
    clean: 'M 4 50 L 180 50 M 150 24 L 196 50 L 150 76',
    hand: 'M 6 54 C 60 44, 120 58, 182 48 M 152 26 C 166 36, 180 44, 194 50 C 180 58, 166 68, 154 76',
    closed: false,
  },
  star: {
    clean: 'M 100 6 L 118 40 L 156 44 L 128 70 L 136 96 L 100 80 L 64 96 L 72 70 L 44 44 L 82 40 Z',
    hand: 'M 100 8 L 120 40 L 156 46 L 130 70 L 138 94 L 100 78 L 62 94 L 70 70 L 42 44 L 80 40 Z',
    closed: true,
  },
  blob: {
    clean:
      'M 100 6 C 150 2, 198 30, 192 58 C 186 86, 140 98, 100 96 C 60 94, 8 82, 6 54 C 4 26, 50 10, 100 6 Z',
    hand: 'M 96 8 C 142 0, 196 22, 194 52 C 192 82, 150 100, 104 95 C 58 90, 10 86, 6 56 C 2 26, 50 16, 96 8 Z',
    closed: true,
  },
  rect: {
    clean: 'M 8 8 H 192 V 92 H 8 Z',
    hand: 'M 10 10 C 70 6, 130 12, 190 8 C 194 36, 190 64, 192 92 C 130 90, 70 94, 8 90 C 6 64, 10 36, 10 10 Z',
    closed: true,
  },
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function ShapeBlock(props: BlockProps<ShapeProps>): ReactElement {
  const { root } = blockParts(
    props,
    'shape',
    'inline-block w-fit [--site-pad-y:0px] [--site-pad-x:0px]'
  );
  const shape = PATHS[props.kind] ?? PATHS.ellipse;
  const d = props.handDrawn === false ? shape.clean : shape.hand;
  const stroke = resolveColorValue(props.stroke, '--site-accent');
  const fill = props.fill ? resolveColorValue(props.fill, '--site-accent') : 'none';
  const width = cssNumber(props.width, shapeDefaults.width);
  const height = cssNumber(props.height, shapeDefaults.height);
  const rotate = cssNumber(props.rotate, 0);
  const strokeWidth = cssNumber(props.strokeWidth, shapeDefaults.strokeWidth);

  return (
    <div {...root}>
      <svg
        className="block overflow-visible"
        width={width}
        height={height}
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={styleVars({
          rotate: rotate ? `${rotate}deg` : undefined,
          '--site-shape-stroke': stroke,
          '--site-shape-fill': fill,
        })}
      >
        <path
          d={d}
          fill="var(--site-shape-fill)"
          stroke="var(--site-shape-stroke)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
