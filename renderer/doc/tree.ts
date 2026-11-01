/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { DocNode, PageDocument } from './schema';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** parent id → slot → children, sorted. */
type ChildIndex = Map<string, Map<string, DocNode[]>>;

const EMPTY: readonly DocNode[] = Object.freeze([]);

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/** Siblings by `order`, plain string comparison; `id` breaks a tie, so the result is total. */
export function compareSiblings(a: DocNode, b: DocNode): number {
  if (a.order !== b.order) return a.order < b.order ? -1 : 1;
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}

/* A document is treated as immutable: every edit makes a new `nodes`, so the
   index is built once per `nodes` object. */
const indexCache = new WeakMap<PageDocument['nodes'], ChildIndex>();

function childIndex(doc: PageDocument): ChildIndex {
  const cached = indexCache.get(doc.nodes);
  if (cached) return cached;
  const index: ChildIndex = new Map();
  for (const node of Object.values(doc.nodes)) {
    if (node.parent === null) continue;
    let slots = index.get(node.parent);
    if (!slots) {
      slots = new Map();
      index.set(node.parent, slots);
    }
    const list = slots.get(node.slot);
    if (list) list.push(node);
    else slots.set(node.slot, [node]);
  }
  for (const slots of index.values()) {
    for (const list of slots.values()) list.sort(compareSiblings);
  }
  indexCache.set(doc.nodes, index);
  return index;
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** The nodes in one slot of a parent, in order. Do not mutate the result. */
export function childrenOf(doc: PageDocument, parentId: string, slot: string): readonly DocNode[] {
  return childIndex(doc).get(parentId)?.get(slot) ?? EMPTY;
}

/** The slots of a node that hold at least one child, by name. */
export function slotsOf(doc: PageDocument, id: string): string[] {
  return [...(childIndex(doc).get(id)?.keys() ?? [])].sort();
}

/**
 * Every node depth first, a parent before its children, in render order:
 * slots by name, each slot's children by `order`. `visit` returning `false`
 * skips that node's subtree.
 */
export function walkDoc(
  doc: PageDocument,
  visit: (node: DocNode, depth: number) => void | false,
  from: string = doc.root
): void {
  const start = doc.nodes[from];
  if (!start) return;
  const stack: Array<{ node: DocNode; depth: number }> = [{ node: start, depth: 0 }];
  while (stack.length > 0) {
    const { node, depth } = stack.pop() as { node: DocNode; depth: number };
    if (visit(node, depth) === false) continue;
    const slots = slotsOf(doc, node.id);
    /* Pushed in reverse, so they pop in order. */
    for (let s = slots.length - 1; s >= 0; s--) {
      const children = childrenOf(doc, node.id, slots[s] as string);
      for (let c = children.length - 1; c >= 0; c--) {
        stack.push({ node: children[c] as DocNode, depth: depth + 1 });
      }
    }
  }
}

/** A node's id and every descendant's, the node first. Empty when the node is absent. */
export function subtreeIds(doc: PageDocument, id: string): string[] {
  const ids: string[] = [];
  walkDoc(doc, (node) => void ids.push(node.id), id);
  return ids;
}

/** The node's ancestors' ids, nearest first. */
export function ancestorIds(doc: PageDocument, id: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>([id]);
  let parent = doc.nodes[id]?.parent ?? null;
  while (parent !== null && !seen.has(parent)) {
    ids.push(parent);
    seen.add(parent);
    parent = doc.nodes[parent]?.parent ?? null;
  }
  return ids;
}

/**
 * Throws when the document is not one tree: the root missing or not a root,
 * a second parentless node, a key that is not its node's id, a parent that
 * does not exist, or a node the root does not reach (an orphan, or a cycle).
 */
export function assertDocShape(doc: PageDocument): void {
  const root = doc.nodes[doc.root];
  if (!root) throw new Error(`Document root "${doc.root}" is missing`);
  if (root.parent !== null) throw new Error(`Document root "${doc.root}" has a parent`);
  for (const [key, node] of Object.entries(doc.nodes)) {
    if (key !== node.id) throw new Error(`Node "${node.id}" is stored under "${key}"`);
    if (node.parent === null && node.id !== doc.root) {
      throw new Error(`Node "${node.id}" has no parent but is not the root`);
    }
    if (node.parent !== null && !doc.nodes[node.parent]) {
      throw new Error(`Node "${node.id}" names a missing parent "${node.parent}"`);
    }
  }
  const reached = new Set<string>();
  walkDoc(doc, (node) => {
    if (reached.has(node.id)) throw new Error(`Node "${node.id}" is reached twice`);
    reached.add(node.id);
  });
  if (reached.size !== Object.keys(doc.nodes).length) {
    const lost = Object.keys(doc.nodes).filter((id) => !reached.has(id));
    throw new Error(`Nodes not reachable from the root (orphans or a cycle): ${lost.join(', ')}`);
  }
}
