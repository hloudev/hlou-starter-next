/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { createElement, Fragment } from 'react';

import type { ComponentType, CSSProperties, ElementType, ReactElement, ReactNode } from 'react';
import type { SiteRenderConfig } from '../config';
import type { StateFormat } from '../contracts';
import type { ScopeDef, ScopeSnapshot } from '../state/schema';
import type { DocNode, PageDocument, SiteComponent } from './schema';
import { DOC_SIDE_MAP_PROP } from './from-puck';
import { applyOverrides } from './overrides';
import { INSTANCE_NODE_TYPE, ROOT_SLOT } from './schema';
import { childrenOf } from './tree';
import { readRenderContext } from '../blocks/types';

import { isStateRef } from '../contracts';
import { deriveAll } from '../state/derive';
import { formatState } from '../state/format';
import { initialValues, todayIso } from '../state/initial';
import { scopeDefOf } from '../state/schema';
import { evaluateWhen, readPath as readScopePath, stepOfWhen } from '../state/when';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type RenderDocInput = {
  /** A resolved document (`resolveDoc`). */
  doc: PageDocument;
  /** What its `instance` nodes draw, resolved too. */
  components: SiteComponent[];
  /** `createSiteConfig`'s shape: `components[type].render` and `root.render`. */
  config: SiteRenderConfig;
  /** What every block reads as `props.puck.metadata`: render context, theme, media. */
  metadata?: Record<string, unknown>;
  /** `false` skips Header and Footer instances. */
  chrome?: boolean;
  /**
   * The Canvas editor's markers (M33-17): every slot wrapper names the node
   * and the slot it holds (`data-hl-node`, `data-hl-slot`), and a component
   * instance's blocks sit in a `display: contents` wrapper naming the
   * component that owns them (`data-hl-owner`), and an empty slot keeps its
   * block's `minEmptyHeight` (M33-24). Off by default: static, preview and
   * Classic output never carry them.
   */
  markers?: boolean;
  /**
   * The Canvas state bar's preview of a scope (decision 198), keyed by scope
   * id: merged over the scope's first state. Never set on a published render.
   */
  previewState?: Record<string, Partial<ScopeSnapshot>>;
  /** `YYYY-MM-DD`: what a scope field's `min: 'today'` means. Defaults to the clock's. */
  today?: string;
};

/** The nearest scope, as every block inside it receives it (`__hl.scope`). */
export type DocScopeEnv = { id: string; def: ScopeDef; snapshot: ScopeSnapshot };

/** One `{ $state }` a block's prop showed, by prop path (`text`, `items.0.value`). */
export type DocStateBind = { p: string; f: StateFormat };

/**
 * What the render pass carries down the tree: the nearest scope, the step a
 * `when` pinned the subtree to, and the instance the blocks are drawn for.
 */
type RenderEnv = { scope?: DocScopeEnv; step?: string; instance?: string };

/** What a block calls a slot prop with (`SlotArea`, `FloatingLayer`). */
export type DocSlotRenderProps = {
  className?: string;
  style?: CSSProperties;
  minEmptyHeight?: number;
  as?: ElementType;
};

type AnyRender = ComponentType<Record<string, unknown>>;

/** The owner a component's blocks are written to, as the Canvas store keys it. */
export const DOC_OWNER_ATTRIBUTE = 'data-hl-owner';
/** On a slot wrapper: the node whose slot it is, and the slot's name. */
export const DOC_SLOT_NODE_ATTRIBUTE = 'data-hl-node';
export const DOC_SLOT_ATTRIBUTE = 'data-hl-slot';

/** A wrapper that draws no box of its own: the blocks lay out as if it were not there. */
const CONTENTS_STYLE: CSSProperties = { display: 'contents' };

/** A node's own fields, which a block reads only through its side map. */
const STRUCTURAL = new Set(['id', 'type', 'parent', 'slot', 'order', 'props', 'hidden']);

/** The nodes whose stray `when` was logged already: once per node, not once per render. */
const LOGGED_STRAY_WHEN = new Set<string>();

/** The block that opens a scope (decision 197). */
export const SCOPE_NODE_TYPE = 'scope';

/** On an instance's wrapper and every block root: the node's `when`, and whether it is off. */
export const DOC_WHEN_ATTRIBUTE = 'data-hl-when';
export const DOC_OFF_ATTRIBUTE = 'data-hl-off';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * The node's document-only fields (`name`, `role`, `section` …) as the `__hl`
 * prop the Classic adapter gives a block in Puck — so a block that reads one
 * (a planned section's label) draws the same in both.
 */
function sideMapOf(node: DocNode): Record<string, unknown> | null {
  let side: Record<string, unknown> | null = null;
  for (const [key, value] of Object.entries(node)) {
    if (STRUCTURAL.has(key) || value === undefined) continue;
    (side ??= {})[key] = value;
  }
  return side;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

/**
 * A scope's render-time snapshot: its first values with no storage and no
 * URL (the runtime reconciles those in the browser), the derived values, the
 * first step — then the canvas preview merged over it.
 */
export function scopeSnapshotOf(
  def: ScopeDef,
  today: string,
  preview?: Partial<ScopeSnapshot>
): ScopeSnapshot {
  const values = {
    ...initialValues(def, { storage: null, query: null, today }),
    ...preview?.values,
  };
  return {
    values,
    derived: { ...deriveAll(def, values), ...preview?.derived },
    step: preview?.step !== undefined ? preview.step : (def.steps[0]?.id ?? null),
    errors: { ...preview?.errors },
  };
}

/**
 * A block's props with every `{ $state }` replaced by its formatted value,
 * each recorded in `binds` by prop path. Unchanged branches keep their
 * reference; resolved collections are not walked.
 */
function bindState(
  value: unknown,
  path: string,
  format: (ref: { $state: string; format?: StateFormat }) => string,
  binds: Record<string, DocStateBind>
): unknown {
  if (isStateRef(value)) {
    const f = value.format ?? 'text';
    binds[path] = { p: value.$state, f };
    return format(value);
  }
  if (Array.isArray(value)) {
    let changed = false;
    const out = value.map((item, index) => {
      const next = bindState(item, path ? `${path}.${index}` : String(index), format, binds);
      if (next !== item) changed = true;
      return next;
    });
    return changed ? out : value;
  }
  if (isPlainObject(value) && !('$resolved' in value)) {
    let out: Record<string, unknown> | null = null;
    for (const [key, item] of Object.entries(value)) {
      const next = bindState(item, path ? `${path}.${key}` : key, format, binds);
      if (next !== item) (out ??= { ...value })[key] = next;
    }
    return out ?? value;
  }
  return value;
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Draws a document with the site's Puck config, without Puck: the markup is
 * the markup Puck 0.23's static `Render` produces from the same tree. A block
 * render gets its props, `id`, `puck` (`metadata`, not editing) and one
 * render function per slot field; a slot draws its children in a `div` (or
 * `as`) with the `className` / `style` it is called with, like Puck's
 * `SlotRender`. A node's document-only fields ride in `__hl`, as the Classic
 * adapter hands them to Puck. Hidden nodes, and types the config does not
 * know, draw nothing. An `instance` draws its component's blocks in place,
 * with its own `overrides` merged (`applyOverrides`).
 *
 * Scopes (decision 197): a `scope` block inside a section opens a scope —
 * its id is the node's (`<instance>/<node>` inside an instance), its
 * snapshot `scopeSnapshotOf` with the canvas `previewState` over it. Every
 * block inside receives it as `__hl.scope`; each `{ $state }` in its props is
 * replaced by the formatted value and recorded in `__hl.binds`; a node with
 * `when` gets `__hl.off` while it is false (an instance, a `display:
 * contents` wrapper carrying `data-hl-when` / `data-hl-off`), and a
 * `$step` equality pins its subtree's `__hl.step`. A nested scope, or one at
 * a document's root, opens nothing; a `when` outside any scope is ignored
 * (and logged once per render).
 *
 * No hooks and no context, so it renders in a server component, a static
 * export and the browser alike.
 */
export function renderDoc({
  doc,
  components,
  config,
  metadata = {},
  chrome = true,
  markers = false,
  previewState,
  today = todayIso(),
}: RenderDocInput): ReactElement {
  const componentsById = new Map(components.map((component) => [component.id, component]));
  const puck = { renderDropZone: () => null, metadata, dragRef: null, isEditing: false };
  const { locale } = readRenderContext(puck);
  /* Nodes whose `when` sits outside any scope: logged after the walk. */
  const strayWhen: string[] = [];

  const renderChildren = (
    owner: PageDocument,
    parentId: string,
    slot: string,
    env: RenderEnv
  ): ReactNode[] => childrenOf(owner, parentId, slot).map((node) => renderNode(owner, node, env));

  /* With the markers (the canvas), an empty slot keeps the height its block
     asks for (`minEmptyHeight`), as Puck's drop zone did: it is where a block
     dropped into it lands (M33-24). Without them nothing changes. */
  const slotFunction =
    (owner: PageDocument, parentId: string, slot: string, env: RenderEnv) =>
    ({ className, style, as, minEmptyHeight }: DocSlotRenderProps = {}): ReactElement => {
      const children = renderChildren(owner, parentId, slot, env);
      if (!markers) return createElement(as ?? 'div', { className, style }, ...children);
      const empty = minEmptyHeight && !children.some((child) => child !== null);
      return createElement(
        as ?? 'div',
        {
          className,
          style: empty ? { ...style, minHeight: minEmptyHeight } : style,
          [DOC_SLOT_NODE_ATTRIBUTE]: parentId,
          [DOC_SLOT_ATTRIBUTE]: slot,
        },
        ...children
      );
    };

  function renderNode(owner: PageDocument, node: DocNode, env: RenderEnv): ReactNode {
    if (node.hidden) return null;
    /* `when` counts only inside a scope; its `$step` pins the subtree's step. */
    const when = node.when !== undefined && env.scope ? node.when : undefined;
    if (node.when !== undefined && !env.scope) strayWhen.push(node.id);
    const off = when !== undefined && env.scope ? !evaluateWhen(when, env.scope.snapshot) : false;
    const pinned = when !== undefined ? stepOfWhen(when) : undefined;
    const inner: RenderEnv = pinned !== undefined ? { ...env, step: pinned } : env;

    if (node.type === INSTANCE_NODE_TYPE) {
      const component = node.instanceOf ? componentsById.get(node.instanceOf) : undefined;
      if (!component) return null;
      if (!chrome && (component.kind === 'header' || component.kind === 'footer')) return null;
      /* What this instance overrides on the component's nodes (M33-21). */
      const source = applyOverrides(component.doc, node.overrides);
      const instance = env.instance ? `${env.instance}/${node.id}` : node.id;
      const blocks = renderChildren(source, source.root, ROOT_SLOT, { ...inner, instance });
      const whenAttributes = when
        ? {
            [DOC_WHEN_ATTRIBUTE]: JSON.stringify(when),
            ...(off ? { [DOC_OFF_ATTRIBUTE]: '' } : {}),
          }
        : {};
      if (markers) {
        return createElement(
          'div',
          {
            key: node.id,
            [DOC_OWNER_ATTRIBUTE]: `component:${component.id}`,
            [DOC_SLOT_NODE_ATTRIBUTE]: node.id,
            style: CONTENTS_STYLE,
            ...whenAttributes,
          },
          ...blocks
        );
      }
      if (when) {
        return createElement(
          'div',
          { key: node.id, style: CONTENTS_STYLE, ...whenAttributes },
          ...blocks
        );
      }
      return createElement(Fragment, { key: node.id }, ...blocks);
    }
    const block = config.components[node.type];
    if (!block) return null;

    /* A scope inside a section opens one; nested, or at a document's root,
       it opens nothing and draws as a plain container. */
    let scoped = inner;
    let opensScope = false;
    if (node.type === SCOPE_NODE_TYPE && !env.scope && node.parent !== owner.root) {
      const id = env.instance ? `${env.instance}/${node.id}` : node.id;
      const def = scopeDefOf(node.props, id);
      scoped = {
        ...inner,
        scope: { id, def, snapshot: scopeSnapshotOf(def, today, previewState?.[id]) },
      };
      opensScope = true;
    }

    let nodeProps: Record<string, unknown> = node.props;
    const binds: Record<string, DocStateBind> = {};
    if (scoped.scope && !opensScope) {
      const { snapshot, def } = scoped.scope;
      const format = (ref: { $state: string; format?: StateFormat }) =>
        formatState(readScopePath(snapshot, ref.$state), ref.format, {
          locale,
          currency: def.currency,
        });
      nodeProps = bindState(node.props, '', format, binds) as Record<string, unknown>;
    }

    const props: Record<string, unknown> = { ...nodeProps, id: node.id, puck };
    const side = sideMapOf(node) ?? {};
    if (!when) delete side.when;
    if (off) side.off = true;
    if (scoped.step !== undefined) side.step = scoped.step;
    if (scoped.scope) side.scope = scoped.scope;
    if (opensScope) side.opensScope = true;
    if (Object.keys(binds).length > 0) side.binds = binds;
    if (Object.keys(side).length > 0) props[DOC_SIDE_MAP_PROP] = side;
    for (const [name, field] of Object.entries(block.fields ?? {})) {
      if (field.type === 'slot') props[name] = slotFunction(owner, node.id, name, scoped);
    }
    return createElement(block.render as AnyRender, { ...props, key: node.id });
  }

  const content = renderChildren(doc, doc.root, ROOT_SLOT, {});
  const unlogged = strayWhen.filter((id) => !LOGGED_STRAY_WHEN.has(id));
  if (unlogged.length > 0) {
    for (const id of unlogged) LOGGED_STRAY_WHEN.add(id);
    console.warn(`[hlou] \`when\` outside any scope, ignored on: ${unlogged.join(', ')}`);
  }
  const rootRender = config.root?.render as AnyRender | undefined;
  if (!rootRender) return createElement(Fragment, null, ...content);
  return createElement(rootRender, {
    ...doc.rootProps,
    puck,
    title: doc.rootProps.title || '',
    editMode: false,
    id: 'puck-root',
    children: createElement(Fragment, null, ...content),
  });
}
