/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { StateFormat } from '../../state/schema';
import type { BlockProps } from '../types';
import type { SummaryProps } from './schema';
import type { SummaryClientProps, SummaryCount, SummaryLine } from './SummaryClient';

import { Island } from '../../render/island';
import { stateMessages } from '../../site/messages';
import { blockParts, literal } from '../shared';
import { iconPaths, widgetImage, widgetScope, widgetStyled, WidgetUnbound } from '../widget-shell';

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const FORMATS: readonly StateFormat[] = [
  'text',
  'integer',
  'number',
  'currency',
  'date',
  'dateRange',
  'nights',
];

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A stored count → its resolved copy, or `null` without a path. */
function countOf(value: unknown): SummaryCount | null {
  if (!isRecord(value) || typeof value.path !== 'string' || !value.path) return null;
  return {
    path: value.path,
    one: literal(value.one as string | undefined, ''),
    other: literal(value.other as string | undefined, ''),
  };
}

/** Stored rows → their resolved copy; read defensively (stored props are not validated). */
function linesOf(value: unknown): SummaryLine[] {
  return (Array.isArray(value) ? value : []).flatMap((row): SummaryLine[] => {
    const value = isRecord(row) && isRecord(row.value) ? row.value : null;
    if (!isRecord(row) || !value || typeof value.path !== 'string') return [];
    const format = FORMATS.find((candidate) => candidate === value.format) ?? 'text';
    const tone = row.tone === 'muted' || row.tone === 'strong' ? row.tone : 'normal';
    return [
      {
        label: literal(row.label as string | undefined, ''),
        detail: (Array.isArray(row.detail) ? row.detail : []).flatMap((item) => {
          const count = countOf(item);
          return count ? [count] : [];
        }),
        path: value.path,
        format,
        ...(Array.isArray(row.when) && row.when.length > 0 ? { when: row.when } : {}),
        tone,
      },
    ];
  });
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * The summary's server shell (M40-14): its copy resolved and its scope's
 * render-time snapshot handed to the island as JSON — the island computes
 * the rows from them, on the server too, so the first paint shows the
 * defaults (and the canvas preview). `sticky` holds it in view from 1024 px.
 * Outside a scope: « Non lié » in the editor, nothing on the site.
 */
export function SummaryBlock(props: BlockProps<SummaryProps>): ReactElement {
  const { root, context, el } = blockParts(
    props,
    'summary',
    props.sticky ? 'lg:sticky lg:top-6 lg:self-start' : ''
  );
  const scope = widgetScope(props);
  const messages = stateMessages(context.locale);
  const title = literal(props.title, '');

  if (!scope) {
    return (
      <div {...root}>
        {context.mode === 'static' ? null : (
          <WidgetUnbound label={messages.widget.unbound}>
            <div className="grid gap-2 text-site-sm opacity-60">
              <span className="font-medium">{title || '—'}</span>
              <span>{messages.total} · —</span>
            </div>
          </WidgetUnbound>
        )}
      </div>
    );
  }

  const total = isRecord(props.total) && typeof props.total.path === 'string' ? props.total : null;
  const image = widgetImage(props.media, '(min-width: 1024px) 380px, 100vw');
  const island: SummaryClientProps = {
    scope: context.mode === 'canvas' ? '' : scope.id,
    locale: context.locale,
    currency: scope.def.currency,
    title,
    ...(image ? { image } : {}),
    rows: linesOf(props.rows),
    lines: countOf(props.lines),
    total: total ? { label: literal(total.label, '') || messages.total, path: total.path } : null,
    after: linesOf(props.after),
    bar: props.mobile === 'bar',
    snapshot: { ...scope.snapshot, errors: {} },
    estimate: messages.estimate,
    note: messages.summary.note,
    show: messages.summary.showDetail,
    hide: messages.summary.hideDetail,
    icons: { info: iconPaths('info'), caret: iconPaths('caret-up') },
    cls: {
      title: widgetStyled(
        el('title', 'mb-2.5 text-site-xs font-medium tracking-[0.1em] text-site-accent uppercase')
      ),
      rows: widgetStyled(
        el('rows', 'flex items-baseline justify-between gap-4 py-2.5 text-site-sm')
      ),
      total: widgetStyled(
        el(
          'total',
          'mt-2 flex items-center justify-between gap-3 border-t border-site-hairline-strong pt-4'
        )
      ),
    },
  };
  return (
    <div {...root}>
      <Island name="summary" markers={context.islands} props={island} />
    </div>
  );
}
