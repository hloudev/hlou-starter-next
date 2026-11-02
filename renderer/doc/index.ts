/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

/* Document v2: the flat page document, its tree, the v1
   converter and the Puck-free renderer. Edit-side logic is the editor's. */
export {
  docNodeSchema,
  docPlaceSchema,
  docPlaceValueSchema,
  INSTANCE_NODE_TYPE,
  pageDocumentSchema,
  ROOT_NODE_TYPE,
  ROOT_SLOT,
  siteComponentKindSchema,
  siteComponentSchema,
} from './schema';
export type { DocNode, DocPlace, PageDocument, SiteComponent, SiteComponentKind } from './schema';
/* A snapshot's page, beside the document it carries; the snapshot itself is
   the contracts' (`siteSnapshotSchema`). */
export { pageDocV2Schema } from '../contracts';
export type { PageDocV2 } from '../contracts';
export {
  ancestorIds,
  assertDocShape,
  childrenOf,
  compareSiblings,
  slotsOf,
  subtreeIds,
  walkDoc,
} from './tree';
export { keysFor, orderKeyBetween } from './order';
export { slotPropsOfType } from './slots';
export type { SlotPropKind, SlotPropsOf } from './slots';
export {
  CHROME_COMPONENT_IDS,
  componentsFromSiteComposition,
  DOC_ROOT_ID,
  DOC_SIDE_MAP_PROP,
  fromPuckData,
  pageDocumentFromComposition,
  withChromeInstances,
} from './from-puck';
export {
  applyOverrides,
  instanceOverrideSchema,
  OVERRIDE_PARTS,
  overriddenNode,
  readOverride,
} from './overrides';
export type { InstanceOverride, OverridePart } from './overrides';
export {
  DOC_OFF_ATTRIBUTE,
  DOC_OWNER_ATTRIBUTE,
  DOC_SLOT_ATTRIBUTE,
  DOC_SLOT_NODE_ATTRIBUTE,
  DOC_WHEN_ATTRIBUTE,
  renderDoc,
  SCOPE_NODE_TYPE,
  scopeSnapshotOf,
} from './render';
export type { DocScopeEnv, DocSlotRenderProps, DocStateBind, RenderDocInput } from './render';
export { resolveDoc } from '../resolve';
export type { ResolveDocInput, ResolvedDoc, ResolveSource } from '../resolve';
