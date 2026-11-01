/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { z } from 'zod';

import { blockRegistry, isBlockKey } from '../blocks';
import { propMeta } from '../config/fields';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** `slot` holds blocks; `floatingSlot` holds only `floating` free elements. */
export type SlotPropKind = 'slot' | 'floatingSlot';

/** The slot props of a block type, in schema order, with their kind. */
export type SlotPropsOf = (type: string) => ReadonlyMap<string, SlotPropKind>;

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

const cache = new Map<string, ReadonlyMap<string, SlotPropKind>>();

/**
 * The props of a block type that hold child blocks — the registry schema's
 * `hl: 'slot'` / `hl: 'floatingSlot'` props, the same rule that makes them
 * Puck `slot` fields. Empty for an unknown type. The one place callers
 * outside the renderer read this from.
 */
export function slotPropsOfType(type: string): ReadonlyMap<string, SlotPropKind> {
  const cached = cache.get(type);
  if (cached) return cached;
  const found = new Map<string, SlotPropKind>();
  if (isBlockKey(type)) {
    for (const [prop, schema] of Object.entries(blockRegistry[type].schema.shape)) {
      const meta = propMeta(schema as z.ZodType);
      if (meta === 'slot' || meta === 'floatingSlot') found.set(prop, meta);
    }
  }
  cache.set(type, found);
  return found;
}
