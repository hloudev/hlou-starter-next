/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { blockRegistry, isBlockKey } from '../blocks';
import { slotPropsOfType } from '../doc/slots';

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * A spec node's props over its block's defaults (M43-06): what the validator
 * checks and what the compiler writes, from this one function so the two
 * cannot drift. A spec may give only the props it changes; a valid spec then
 * never reaches the renderer with a content prop missing (a `hero` without
 * `buttons`). The block's slot props are not filled — they hold child nodes,
 * and a stored document leaves them out. Not a block (`root`, `instance`, an
 * unknown type): the props as they are.
 */
export function withBlockDefaults(
  type: string,
  props: Record<string, unknown>
): Record<string, unknown> {
  if (!isBlockKey(type)) return props;
  const slots = slotPropsOfType(type);
  const defaults = Object.fromEntries(
    Object.entries(blockRegistry[type].defaults as Record<string, unknown>).filter(
      ([key]) => !slots.has(key)
    )
  );
  return { ...defaults, ...props };
}
