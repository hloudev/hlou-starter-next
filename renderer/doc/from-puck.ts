/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { PuckComponentData, PuckData } from '../contracts';
import type { DocNode, PageDocument, SiteComponent, SiteComponentKind } from './schema';
import type { SlotPropsOf } from './slots';
import { keysFor, orderKeyBetween } from './order';
import { INSTANCE_NODE_TYPE, ROOT_NODE_TYPE, ROOT_SLOT } from './schema';
import { slotPropsOfType } from './slots';
import { childrenOf } from './tree';

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** The root node's id in a document built from Puck data. */
export const DOC_ROOT_ID = 'root';

/**
 * The Puck prop that carries a node's document-only fields (`name`, `role`,
 * `variant`, `design`, `instanceOf`, `overrides`) through Puck data and back,
 * so `fromPuckData(toPuckData(doc))` loses nothing. Written by the Classic
 * adapter, read here.
 */
export const DOC_SIDE_MAP_PROP = '__hl';

/**
 * Puck's editing flags (`_`-prefixed), which a document carries as fields or
 * not at all: `_hidden` becomes `hidden`; the others (the Classic adapter's
 * own) are dropped — components carry what they meant.
 */
const HIDDEN_FLAG = '_hidden';
const isEditingFlag = (key: string) => key.startsWith('_') && key !== DOC_SIDE_MAP_PROP;

/** Node fields a side map may never set: the node's place and identity. */
const STRUCTURAL_FIELDS = new Set(['id', 'type', 'parent', 'slot', 'order', 'props', 'hidden']);

/** The ids `componentsFromSiteComposition` gives Header and Footer until the service mints uuids. */
export const CHROME_COMPONENT_IDS = {
  header: 'component:header',
  footer: 'component:footer',
} as const;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isComponentData(value: unknown): value is PuckComponentData {
  return (
    isRecord(value) &&
    typeof value.type === 'string' &&
    isRecord(value.props) &&
    typeof value.props.id === 'string' &&
    value.props.id.length > 0
  );
}

/** The document-only fields a side map carries, structural ones ignored. */
function sideMapFields(value: unknown): Partial<DocNode> {
  if (!isRecord(value)) return {};
  const fields: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(value)) {
    if (!STRUCTURAL_FIELDS.has(key) && field !== undefined) fields[key] = field;
  }
  return fields as Partial<DocNode>;
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Puck data → a flat document. Pure.
 *
 * - Every block becomes a node whose `id` is its `props.id`.
 * - A slot prop (an array under a prop `slotPropsOf` names) becomes the
 *   node's children in that `slot`, ordered as the array is. An EMPTY one
 *   stays in `props` as `[]`, so a block saved with `floating: []` comes
 *   back from `toPuckData` exactly as it was; a slot field draws its
 *   children whatever the prop holds.
 * - `props` keeps the rest without `id`; `_hidden` becomes `hidden: true`;
 *   the other editing flags are dropped (components carry them now); a
 *   `__hl` side map is spread back onto the node.
 * - The root is `{ id: 'root', type: 'root' }` with `data.root.props` as
 *   `rootProps`; any other key of `data.root` stays on the root node's props.
 *
 * A second block with an id already taken gets `<id>~<n>`, so a damaged
 * tree still renders every block rather than losing one.
 */
export function fromPuckData(
  data: PuckData | null,
  slotPropsOf: SlotPropsOf = slotPropsOfType
): PageDocument {
  const { props: rawRootProps, ...rootRest } = (data?.root ?? {}) as Record<string, unknown>;
  const nodes: Record<string, DocNode> = {
    [DOC_ROOT_ID]: {
      id: DOC_ROOT_ID,
      type: ROOT_NODE_TYPE,
      parent: null,
      slot: '',
      order: keysFor(1)[0] as string,
      props: rootRest,
    },
  };

  const uniqueId = (id: string): string => {
    if (!nodes[id]) return id;
    let n = 2;
    while (nodes[`${id}~${n}`]) n++;
    return `${id}~${n}`;
  };

  const place = (items: unknown[], parent: string, slot: string) => {
    const blocks = items.filter(isComponentData);
    const keys = keysFor(blocks.length);
    blocks.forEach((item, index) => {
      const id = uniqueId(item.props.id);
      const slotProps = slotPropsOf(item.type);
      const props: Record<string, unknown> = {};
      const children: Array<[string, unknown[]]> = [];
      let hidden = false;
      let side: Partial<DocNode> = {};
      for (const [key, value] of Object.entries(item.props)) {
        if (key === HIDDEN_FLAG) hidden = value === true;
        else if (key === 'id' || isEditingFlag(key)) continue;
        else if (key === DOC_SIDE_MAP_PROP) side = sideMapFields(value);
        else if (slotProps.has(key) && Array.isArray(value) && value.length > 0) {
          children.push([key, value]);
        } else props[key] = value;
      }
      nodes[id] = {
        ...side,
        id,
        type: item.type,
        parent,
        slot,
        order: keys[index] as string,
        props,
        ...(hidden ? { hidden: true } : {}),
      };
      for (const [childSlot, list] of children) place(list, id, childSlot);
    });
  };
  place(data?.content ?? [], DOC_ROOT_ID, ROOT_SLOT);

  return {
    root: DOC_ROOT_ID,
    rootProps: isRecord(rawRootProps) ? rawRootProps : {},
    nodes,
  };
}

/**
 * A v1 site composition → Header and Footer components. Header holds every
 * block that is not a footer, Footer the footers — `SiteRender`'s split,
 * and `mergeSiteAndPage`'s. Both always exist (empty when there is no
 * composition), under stable placeholder ids.
 */
export function componentsFromSiteComposition(
  data: PuckData | null,
  slotPropsOf: SlotPropsOf = slotPropsOfType
): SiteComponent[] {
  const content = data?.content ?? [];
  const component = (kind: SiteComponentKind & keyof typeof CHROME_COMPONENT_IDS, name: string) =>
    ({
      id: CHROME_COMPONENT_IDS[kind],
      key: kind,
      name,
      kind,
      doc: fromPuckData(
        {
          root: {},
          content: content.filter((item) => (item.type === 'footer') === (kind === 'footer')),
        },
        slotPropsOf
      ),
    }) satisfies SiteComponent;
  return [component('header', 'Header'), component('footer', 'Footer')];
}

/**
 * A page document with an `instance` of the Header component before its
 * first block and one of the Footer component after its last — unless it
 * already places an instance, in which case it is returned as is.
 */
export function withChromeInstances(doc: PageDocument, components: SiteComponent[]): PageDocument {
  if (Object.values(doc.nodes).some((node) => node.type === INSTANCE_NODE_TYPE)) return doc;
  const header = components.find((component) => component.kind === 'header');
  const footer = components.find((component) => component.kind === 'footer');
  if (!header && !footer) return doc;

  const children = childrenOf(doc, doc.root, ROOT_SLOT);
  const first = children[0]?.order ?? null;
  const last = children[children.length - 1]?.order ?? null;
  const nodes = { ...doc.nodes };
  const instance = (component: SiteComponent, order: string): DocNode => {
    let id = `instance:${component.key}`;
    while (nodes[id]) id = `${id}~`;
    return {
      id,
      type: INSTANCE_NODE_TYPE,
      parent: doc.root,
      slot: ROOT_SLOT,
      order,
      props: {},
      instanceOf: component.id,
    };
  };
  let headerOrder: string | null = null;
  if (header) {
    headerOrder = orderKeyBetween(null, first);
    const node = instance(header, headerOrder);
    nodes[node.id] = node;
  }
  if (footer) {
    const node = instance(footer, orderKeyBetween(last ?? headerOrder, null));
    nodes[node.id] = node;
  }
  return { ...doc, nodes };
}

/** A page's v1 composition as the v2 document it upgrades to. */
export function pageDocumentFromComposition(
  composition: PuckData | null,
  components: SiteComponent[],
  slotPropsOf: SlotPropsOf = slotPropsOfType
): PageDocument {
  return withChromeInstances(fromPuckData(composition, slotPropsOf), components);
}
