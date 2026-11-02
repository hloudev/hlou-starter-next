/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { z } from 'zod';

import { boundSchema, slotContentSchema } from '../../contracts';
import { iconSchema, itemStyleSchema, styleProps } from '../style-props';

/** What a click on the canvas can pick inside the tabs — each styleable. */
export const TABS_ELEMENTS = ['tabs', 'panels'] as const;

export const TABS_PANEL_KEYS = [
  'panel1',
  'panel2',
  'panel3',
  'panel4',
  'panel5',
  'panel6',
] as const;
export type TabsPanelKey = (typeof TABS_PANEL_KEYS)[number];

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

export const tabItemSchema = z.object({
  label: boundSchema(z.string()),
  icon: iconSchema.optional(),
  style: itemStyleSchema,
});
export type TabItem = z.infer<typeof tabItemSchema>;

/**
 * Tabs: one to six, each a slot. The panel count follows `tabs`; a
 * panel beyond it keeps its blocks and is not drawn (the grid's rule), so
 * removing a tab loses nothing. Server markup, wired by a child-less island.
 */
export const tabsSchema = z.object({
  tabs: z.array(tabItemSchema).min(1).max(6),
  look: z.enum(['underline', 'pills']),
  align: z.enum(['start', 'center']),
  panel1: slotContentSchema,
  panel2: slotContentSchema,
  panel3: slotContentSchema,
  panel4: slotContentSchema,
  panel5: slotContentSchema,
  panel6: slotContentSchema,
  ...styleProps(TABS_ELEMENTS),
});
export type TabsProps = z.infer<typeof tabsSchema>;
