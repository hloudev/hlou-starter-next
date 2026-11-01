/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { TabsProps } from './schema';
import { TABS_PANEL_KEYS } from './schema';

import { Island } from '../../render/island';
import { stateMessages } from '../../site/messages';
import { blockParts, Icon, literal, SlotArea } from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/* The strip scrolls sideways on a phone (snap), never wraps; its 4 px of
   padding keep the focus ring clear of the scroll clip. The underline and
   the pill's motion live in `site.css` (`.hl-tabs`). */
const LIST: Record<TabsProps['look'], string> = {
  underline:
    'hl-tabs__list -mx-1 flex snap-x gap-5 overflow-x-auto px-1 pt-1 [scrollbar-width:none] md:gap-7',
  pills:
    'hl-tabs__list inline-flex max-w-full snap-x gap-1.5 overflow-x-auto rounded-site-pill bg-site-well p-1 [scrollbar-width:none]',
};

const TAB: Record<TabsProps['look'], string> = {
  underline:
    'hl-tabs__tab relative inline-flex shrink-0 cursor-pointer snap-start items-center gap-2 whitespace-nowrap border-0 bg-transparent px-0 pt-0 pb-3.5 font-[inherit] text-site-sm text-site-ink-soft aria-selected:text-site-ink',
  pills:
    'hl-tabs__tab inline-flex shrink-0 cursor-pointer snap-start items-center gap-2 whitespace-nowrap rounded-site-pill border-0 bg-transparent px-4.5 py-2 font-[inherit] text-site-sm text-site-ink-soft aria-selected:bg-site-card aria-selected:text-site-ink',
};

const ALIGN: Record<TabsProps['align'], string> = {
  start: '',
  center: 'justify-center-safe',
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * The APG tabs pattern as server markup (M40-10): a `tablist` of buttons and
 * one `tabpanel` per tab, each a slot. The first tab is selected and the
 * others' panels are `hidden` — without a script the first tab shows. A
 * child-less island (`TabsClient`) wires selection onto this markup and
 * upgrades the hidden panels to `hidden="until-found"`, so find-in-page
 * reveals them; it never re-renders a panel. The canvas draws every panel,
 * stacked under a band, so each is a drop zone (the accordion's precedent).
 */
export function TabsBlock(props: BlockProps<TabsProps>): ReactElement {
  const { root, context, el, item } = blockParts(props, 'tabs');
  const canvas = context.mode === 'canvas';
  const look = props.look === 'pills' ? 'pills' : 'underline';
  const tabs = Array.isArray(props.tabs) ? props.tabs.slice(0, TABS_PANEL_KEYS.length) : [];
  const band = stateMessages(context.locale).tabs.band;
  const tabId = (index: number) => `${props.id}-tab-${index + 1}`;
  const panelId = (index: number) => `${props.id}-panel-${index + 1}`;

  return (
    <div {...root}>
      <div
        className={cx(
          `hl-tabs hl-tabs--${look} mx-auto w-full max-w-site-content in-[.hl-slot]:max-w-none`
        )}
      >
        <div role="tablist" {...el('tabs', cx(LIST[look], ALIGN[props.align]))}>
          {tabs.map((tab, index) => {
            const box = item('tabs', index, tab, TAB[look]);
            return (
              <button
                key={tabId(index)}
                type="button"
                role="tab"
                id={tabId(index)}
                aria-controls={panelId(index)}
                aria-selected={index === 0}
                tabIndex={index === 0 ? 0 : -1}
                {...box}
              >
                {tab.icon ? <Icon icon={tab.icon} className="size-4" /> : null}
                {literal(tab.label, '')}
              </button>
            );
          })}
        </div>
        <div {...el('panels', 'pt-7')}>
          {tabs.map((tab, index) => {
            const slot = props[TABS_PANEL_KEYS[index]!];
            if (canvas) {
              return (
                <div key={panelId(index)} className={cx(index > 0 && 'mt-6')}>
                  <p className="hl-canvas-band mb-3 font-mono text-[10px] tracking-[0.06em] text-site-ink-soft uppercase">
                    {`${band.replace('{n}', String(index + 1))} · ${literal(tab.label, '')}`}
                  </p>
                  <div role="tabpanel" id={panelId(index)} aria-labelledby={tabId(index)}>
                    <SlotArea slot={slot} />
                  </div>
                </div>
              );
            }
            return (
              <div
                key={panelId(index)}
                role="tabpanel"
                id={panelId(index)}
                aria-labelledby={tabId(index)}
                tabIndex={0}
                hidden={index > 0}
              >
                <SlotArea slot={slot} />
              </div>
            );
          })}
        </div>
      </div>
      <Island name="tabs" markers={context.islands} props={{ count: tabs.length, inert: canvas }} />
    </div>
  );
}
