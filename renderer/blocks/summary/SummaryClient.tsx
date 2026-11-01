'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import type { ReactElement, ReactNode } from 'react';
import type { LineItem, StateFormat } from '../../state/schema';
import type { WidgetImage, WidgetSnapshot, WidgetStyled } from '../widget-client';

import { formatState } from '../../state/format';
import { evaluateWhen, readPath } from '../../state/when';
import { useScopeSnapshot, WidgetIcon } from '../widget-client';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** A count and its unit words: « 3 nuits ». */
export type SummaryCount = { path: string; one: string; other: string };

/** One row, its copy resolved by the server shell. */
export type SummaryLine = {
  label: string;
  detail: SummaryCount[];
  path: string;
  format: StateFormat;
  /** A `when`, evaluated live (R1's `when.ts`). */
  when?: unknown;
  tone: 'normal' | 'muted' | 'strong';
};

export type SummaryClientProps = {
  /** The scope's id; `''` in the canvas (inert). */
  scope: string;
  locale: string;
  currency: string | null;
  title: string;
  image?: WidgetImage;
  rows: SummaryLine[];
  /** A derived `lines` value: one row per item, « × 2 personnes ». */
  lines: SummaryCount | null;
  total: { label: string; path: string } | null;
  after: SummaryLine[];
  /** Under 768 px, a bottom bar on `<details>` that opens the card. */
  bar: boolean;
  /** The render-time snapshot: the first render, and the canvas's for good. */
  snapshot: WidgetSnapshot;
  estimate: string;
  note: string;
  show: string;
  hide: string;
  icons: { info: string[]; caret: string[] };
  cls: Record<'title' | 'rows' | 'total', WidgetStyled>;
};

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

const TONE: Record<SummaryLine['tone'], string> = {
  normal: '',
  muted: 'text-site-ink-soft',
  strong: 'font-semibold',
};

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * The summary island (M40-14): the card, live — its rows read the scope
 * through R1's pure helpers on every change (`readPath`, `evaluateWhen`,
 * `formatState`), a `lines` value draws one row per item, the total always
 * carries « Estimation », and a note under the card says every amount is
 * indicative. The island owns this markup (no `data-hl-bind` inside it).
 * With `bar`, under 768 px the card hides and a fixed bottom bar on
 * `<details>` — no script for the toggle — opens it as a sheet.
 */
export function SummaryClient(props: SummaryClientProps): ReactElement {
  const snapshot = useScopeSnapshot(props.scope, props.snapshot);
  const { locale, cls } = props;
  const read = (path: string) => readPath(snapshot, path);
  const format = (value: unknown, as: StateFormat) =>
    formatState(value, as, { locale, currency: props.currency });
  const plural = new Intl.PluralRules(locale);
  const count = (item: SummaryCount, n: unknown) =>
    typeof n === 'number'
      ? `${format(n, 'integer')} ${plural.select(n) === 'one' ? item.one : item.other}`
      : '';

  const row = (key: string | number, label: string, detail: string, amount: string, tone = '') => (
    <div key={key} {...cls.rows} className={`${cls.rows.className} ${tone}`}>
      <span className="grid">
        <span className="font-medium">{label}</span>
        {detail ? <span className="text-site-xs text-site-ink-soft">{detail}</span> : null}
      </span>
      <span className="tabular-nums whitespace-nowrap">{amount}</span>
    </div>
  );
  const rowsOf = (lines: SummaryLine[]) =>
    lines
      .filter((line) => evaluateWhen(line.when, snapshot))
      .map((line, index) =>
        row(
          index,
          line.label,
          line.detail
            .map((item) => count(item, read(item.path)))
            .filter(Boolean)
            .join(' × '),
          format(read(line.path), line.format),
          TONE[line.tone]
        )
      );

  const unit = props.lines;
  const lines = unit ? read(unit.path) : null;
  const items =
    lines && typeof lines === 'object' && Array.isArray((lines as { items?: unknown }).items)
      ? ((lines as { items: LineItem[] }).items ?? [])
      : [];
  const totalAmount = props.total ? format(read(props.total.path), 'currency') : '';
  const label = (
    <span className="inline-flex items-center gap-2 text-site-xs font-medium tracking-[0.1em] uppercase">
      {props.total?.label}
      <span className="rounded-site-pill bg-site-accent-soft px-2 py-0.5 text-[0.9em] tracking-[0.04em] text-site-accent normal-case">
        {props.estimate}
      </span>
    </span>
  );
  const after = rowsOf(props.after);

  const card = (image: boolean): ReactNode => (
    <>
      {image && props.image ? (
        <img {...props.image} className="block aspect-[16/11] w-full object-cover" />
      ) : null}
      <div className="px-6 pt-[1.375rem] pb-5">
        {props.title ? <p {...cls.title}>{props.title}</p> : null}
        {rowsOf(props.rows)}
        {unit
          ? items.map((item) =>
              row(
                item.id,
                item.title,
                `× ${count(unit, item.qty)}`,
                format(item.amount, 'currency')
              )
            )
          : null}
        {props.total ? (
          <div {...cls.total}>
            {label}
            <span className="font-heading text-site-lg leading-none whitespace-nowrap text-site-accent tabular-nums">
              {totalAmount}
            </span>
          </div>
        ) : null}
        {after.length > 0 ? (
          <div className="hl-summary__after mt-3.5 rounded-site bg-site-well px-3.5 py-1 text-site-xs">
            {after}
          </div>
        ) : null}
      </div>
      <p className="m-0 flex items-start gap-2 border-t border-site-hairline px-6 pt-3 pb-4 text-site-xs text-site-ink-soft">
        <WidgetIcon d={props.icons.info} className="mt-px size-4" />
        {props.note}
      </p>
    </>
  );

  const name = props.title || props.total?.label || undefined;
  return (
    <>
      <aside
        aria-label={name}
        className={`hl-summary overflow-hidden rounded-site border border-site-hairline-strong bg-site-card ${props.bar ? 'max-md:hidden' : ''}`}
      >
        {card(true)}
      </aside>
      {props.bar ? (
        <details className="hl-summary-bar md:hidden">
          <summary className="hl-summary-bar__head flex min-h-[4.25rem] cursor-pointer list-none items-center justify-between gap-3 px-5 py-2.5">
            <span className="grid gap-0.5">
              {label}
              <span className="font-heading text-[calc(var(--site-type-lg)*0.8)] leading-none text-site-accent tabular-nums">
                {totalAmount}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-site-xs text-site-ink-soft">
              <span className="hl-summary-bar__show">{props.show}</span>
              <span className="hl-summary-bar__hide">{props.hide}</span>
              <WidgetIcon d={props.icons.caret} className="hl-summary-bar__caret size-4" />
            </span>
          </summary>
          <div className="hl-summary-bar__sheet">
            <aside
              aria-label={name}
              className="overflow-hidden rounded-site border border-site-hairline-strong bg-site-card"
            >
              {card(false)}
            </aside>
          </div>
        </details>
      ) : null}
    </>
  );
}
