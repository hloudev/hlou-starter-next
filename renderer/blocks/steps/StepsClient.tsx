'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import type { ReactElement } from 'react';
import type { WidgetStyled } from '../widget-client';

import { useScopeState } from '../../state/react';
import { useLive, WidgetIcon } from '../widget-client';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type StepsClientProps = {
  /** The scope's id; `''` in the canvas (inert). */
  scope: string;
  steps: Array<{ id: string; label: string }>;
  /** The render-time `$step`. */
  step: string | null;
  clickable: boolean;
  showLabels: boolean;
  compact: 'auto' | 'always';
  /** « Étapes », « Étape {n} sur {total} », « Revenir à l’étape {label} ». */
  nav: string;
  of: string;
  back: string;
  /** Every step (`items`), and the current one over it (`current`). */
  cls: Record<'items' | 'current', WidgetStyled>;
  check: string[];
};

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * The step indicator island: the scope's steps and `$step`, live.
 * From 768 px a row — done steps a check (a button back to them with
 * `clickable`, dispatching `step.go`), the current one `aria-current`,
 * upcoming ones muted, joined by hairlines; under it (or always, with
 * `compact`) one line « Étape 2 sur 4 · Options » over a progress bar.
 * Logical properties only: RTL mirrors the row and the bar's fill.
 */
export function StepsClient(props: StepsClientProps): ReactElement {
  const { steps, cls } = props;
  const [raw, dispatch] = useScopeState<unknown>(props.scope, '$step', props.step);
  const live = useLive(props.scope);
  const at = Math.max(
    0,
    steps.findIndex((step) => step.id === raw)
  );
  const current = steps[at];
  const total = steps.length;
  const fill = (template: string, values: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

  return (
    <nav aria-label={props.nav} className="hl-steps">
      <ol
        className={`hl-steps__row m-0 flex list-none p-0 ${props.compact === 'always' ? 'hidden' : 'max-md:hidden'}`}
      >
        {steps.map((step, index) => {
          const state = index < at ? 'done' : index === at ? 'current' : 'next';
          const body = (
            <>
              <span className="hl-step__dot grid size-[2.125rem] shrink-0 place-items-center rounded-full border border-site-hairline-strong bg-site-card text-site-xs text-site-ink-soft tabular-nums group-data-[state=current]:border-site-accent group-data-[state=current]:bg-site-accent group-data-[state=current]:text-site-on-accent group-data-[state=done]:border-transparent group-data-[state=done]:bg-site-accent-soft group-data-[state=done]:text-site-accent">
                {state === 'done' ? <WidgetIcon d={props.check} className="size-4" /> : index + 1}
              </span>
              <span
                className={`hl-step__label text-site-xs tracking-[0.1em] whitespace-nowrap text-site-ink-soft uppercase group-data-[state=current]:font-medium group-data-[state=current]:text-site-ink group-data-[state=done]:text-site-accent ${props.showLabels ? '' : 'sr-only'}`}
              >
                {step.label}
              </span>
            </>
          );
          const own = state === 'current' ? cls.current : undefined;
          return (
            <li
              key={step.id}
              {...cls.items}
              {...own}
              className={`${cls.items.className} ${own?.className ?? ''}`}
              style={{ ...cls.items.style, ...own?.style }}
              data-state={state}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {state === 'done' && props.clickable ? (
                <button
                  type="button"
                  className="hl-step__back inline-flex cursor-pointer items-center gap-3 rounded-site border-0 bg-transparent p-0 font-[inherit] text-[inherit]"
                  aria-label={fill(props.back, { label: step.label })}
                  disabled={!live}
                  onClick={() => dispatch({ do: 'step.go', step: step.id })}
                >
                  {body}
                </button>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ol>
      <div
        className={`hl-steps__compact grid gap-2.5 ${props.compact === 'always' ? '' : 'md:hidden'}`}
      >
        <p className="m-0 text-site-xs font-medium tracking-[0.1em] uppercase">
          {fill(props.of, { n: at + 1, total })}
          {current ? <span className="text-site-ink-soft"> · {current.label}</span> : null}
        </p>
        <div
          role="progressbar"
          aria-label={props.nav}
          aria-valuenow={at + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          className="h-[3px] overflow-hidden rounded-site-pill bg-site-hairline-strong"
        >
          <span
            className="block h-full bg-site-accent motion-safe:transition-[inline-size] motion-safe:duration-300"
            style={{ inlineSize: `${((at + 1) / Math.max(1, total)) * 100}%` }}
          />
        </div>
      </div>
    </nav>
  );
}
