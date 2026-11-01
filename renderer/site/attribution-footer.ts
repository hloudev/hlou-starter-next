/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { PageDocument, SiteComponent } from '../doc/schema';
import type { AttributionFooterTheme } from './attribution';

import { applyOverrides } from '../doc/overrides';
import { INSTANCE_NODE_TYPE, ROOT_SLOT } from '../doc/schema';
import { childrenOf, slotsOf } from '../doc/tree';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** The Footer block that carries the badge: its node id and its theme. */
export type AttributionFooter = { id: string; theme: AttributionFooterTheme };

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** The Footer block's registry key. */
const FOOTER_BLOCK_TYPE = 'footer';

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * The first Footer block a page draws, in drawing order — the one whose legal
 * row closes with the « Propulsé par Hlou » badge (decision 193). It walks
 * the tree the way `renderDoc` does: a hidden node draws nothing and neither
 * does anything under it, an `instance` draws its component's blocks with its
 * own overrides, and without `chrome` the Header and Footer instances are
 * skipped. `null` when nothing visible is a footer: `SiteRoot` then draws the
 * badge in a centred row of its own.
 *
 * Also reads one component's own document (`components` empty), which is how
 * the settings learn the footer's theme.
 */
export function attributionFooter(
  doc: PageDocument,
  components: readonly SiteComponent[],
  chrome = true
): AttributionFooter | null {
  const byId = new Map(components.map((component) => [component.id, component]));
  /* An instance of an instance never recurses forever. */
  const entered = new Set<string>();

  function search(owner: PageDocument, parentId: string, slot: string): AttributionFooter | null {
    for (const node of childrenOf(owner, parentId, slot)) {
      if (node.hidden) continue;
      if (node.type === INSTANCE_NODE_TYPE) {
        const component = node.instanceOf ? byId.get(node.instanceOf) : undefined;
        if (!component || entered.has(component.id)) continue;
        if (!chrome && (component.kind === 'header' || component.kind === 'footer')) continue;
        entered.add(component.id);
        const source = applyOverrides(component.doc, node.overrides);
        const found = search(source, source.root, ROOT_SLOT);
        entered.delete(component.id);
        if (found) return found;
        continue;
      }
      if (node.type === FOOTER_BLOCK_TYPE) {
        return { id: node.id, theme: node.props.theme === 'paper' ? 'paper' : 'ink' };
      }
      for (const inner of slotsOf(owner, node.id)) {
        const found = search(owner, node.id, inner);
        if (found) return found;
      }
    }
    return null;
  }

  return search(doc, doc.root, ROOT_SLOT);
}
