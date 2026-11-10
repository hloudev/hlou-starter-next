/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

export * from './contracts';
export { humanize } from './config';
export { blockRegistry, BLOCK_KEYS, isBlockKey, resolveVideoSource } from './blocks';
export { SLOT_DISALLOWED, fontPropNames } from './config/fields';
export type {
  BlockDefinition,
  BlockKey,
  BlockCategory,
  BlockProps,
  RenderMode,
  SiteRenderContext,
} from './blocks';
export { DEFAULT_RENDER_CONTEXT, RENDER_CONTEXT_METADATA_KEY, readRenderContext } from './blocks';
export {
  createSiteConfig,
  siteConfig,
  getSiteConfig,
  THEME_METADATA_KEY,
  SITE_MEDIA_METADATA_KEY,
  ATTRIBUTION_METADATA_KEY,
  ATTRIBUTION_FOOTER_METADATA_KEY,
} from './config';
export type {
  SiteConfigOptions,
  SiteRenderConfig,
  SiteBlockConfig,
  SiteBlockRenderProps,
  SiteField,
  SiteFieldOption,
  SiteFieldType,
  CustomField,
  CustomFieldDrawProps,
  CustomFieldKind,
  CustomFieldScope,
  CustomFieldRenderer,
  CustomFieldRenderProps,
} from './config';
export {
  resolveDoc,
  resolveSlot,
  resolveCollectionRecords,
  listStaticPaths,
  findRecordBySlug,
  prefixHref,
  ariaCurrent,
  currentLink,
} from './resolve';
export type {
  ResolvedCollectionWithQuery,
  ResolvedDoc,
  ResolveMissing,
  ResolveDocInput,
  ResolveOptions,
  ResolveSource,
  StaticPath,
} from './resolve';
export { renderRichText, richTextToPlain } from './richtext';
export * from './doc';
export { SiteRender } from './render';
export type { SiteRenderProps } from './render';
export {
  themeToCss,
  schemesCss,
  SITE_ROOT_CLASS,
  SITE_SCOPE_CLASS,
  DEFAULT_THEME_TOKENS,
} from './theme';
export type { SiteCssVariable, SiteCssVariables } from './theme';
export {
  contrastRatio,
  hexToOklch,
  relativeLuminance,
  resolveDarkColors,
  SITE_SCHEME_ATTRIBUTE,
  SITE_SCHEME_SCRIPT,
  SITE_SCHEME_STORAGE_KEY,
} from './theme/scheme';
export { googleFontsHref, fontFaceCss, fontPreloads } from './theme/fonts';
export type { FontPreload } from './theme/fonts';
export {
  GOOGLE_FONTS_CATALOG,
  searchGoogleFonts,
  fontCategory,
} from './theme/google-fonts-catalog';
export type { GoogleFontCatalogEntry, GoogleFontCategory } from './theme/google-fonts-catalog';
export {
  BREAKPOINTS,
  BREAKPOINT_MIN_WIDTH,
  breakpointForWidth,
  valueAt,
  siteStyleClasses,
  siteUtilityClasses,
  sanitiseClasses,
  classIssues,
  CLASS_TOKEN_MAX,
  CLASS_TOKENS_MAX,
  SPACE_STEPS,
  spaceStepPx,
  TEXT_SIZES,
  ASPECT_RATIOS,
  MARGIN_STEPS,
  RADII,
  BORDER_WIDTHS,
  BORDER_STYLES,
  SHADOWS,
  OPACITIES,
  WIDTHS,
  MAX_WIDTHS,
  MIN_HEIGHTS,
  OVERFLOWS,
  WEIGHTS,
  LEADINGS,
  TRACKINGS,
  TEXT_TRANSFORMS,
  TEXT_ALIGNS,
  TEXT_WRAPS,
  DECORATIONS,
} from './blocks/tw';
export type {
  Breakpoint,
  Responsive,
  SpaceStep,
  SpacingSteps,
  TextSize,
  AspectRatio,
  MarginStep,
  Radius,
  StyleValue,
  FrameValue,
} from './blocks/tw';
export { FRAME_ROTATION_MAX, FRAME_SIZE_MAX, readFrame } from './blocks/tw';
export type { BoxStyle } from './blocks/style-props';
export {
  POSITION_ANCHORS,
  POSITION_OFFSET_MAX,
  POSITION_WIDTH_MAX,
  POSITION_Z_MAX,
} from './blocks/style-props';
export type { PositionAnchor, PositionValue, ResponsivePosition } from './blocks/style-props';
export { DEFAULT_POSITION, dragPosition, positionVarsAt, readPosition } from './blocks/floating';
export { FLOATING_SLOT_ALLOWED } from './config/fields';
export * from './site';

/* The surface / motion / span vocabulary, the layout literals and the icon set. */
export {
  COL_SPANS,
  COLUMN_COUNTS,
  FLEX_DIRECTION_CLASSES,
  FLEX_DIRECTIONS,
  GRID_COLUMN_CLASSES,
  hasSurface,
  MASONRY_COLUMN_CLASSES,
  responsiveLiteralClasses,
  ROW_SPANS,
  SURFACE_FITS,
  SURFACE_POSITION_CSS,
  SURFACE_POSITIONS,
  SURFACE_UTILITIES,
  surfaceClasses,
} from './blocks/tw';
export type { ColumnCount, FlexDirection, SurfacePosition } from './blocks/tw';
export { ICON_NAMES, ICON_PATHS, isIconName } from './blocks/icon-paths';

/* Section roles, variants, design options and colour schemes. */
export {
  DENSITY_VALUES,
  isSectionRole,
  readNodeDesign,
  SCHEME_DESIGN_KEY,
  SECTION_ROLES,
} from './blocks/design-options';
export type {
  BlockDesign,
  BlockVariant,
  DesignChoice,
  DesignLayer,
  DesignOption,
  SectionRole,
} from './blocks/design-options';
export {
  applyDesign,
  blockDesignOptions,
  blockRole,
  blocksForRole,
  blockVariants,
  designIssue,
  designLayers,
  designStyleTree,
  findVariant,
  mergeStyles,
  nodeRole,
  nodeThumbnail,
  siteBuildClasses,
  variantPreset,
} from './blocks/design';
export type { IconName } from './blocks/icon-paths';
export {
  boxStyleObjectSchema,
  iconSchema,
  motionSchema,
  surfaceSchema,
  utilityClassesSchema,
} from './blocks/style-props';
export type { IconValue, MotionValue, SurfaceValue } from './blocks/style-props';
/* The motion spec, presets, personality and attribute (M47); also `./motion`. */
export * from './motion';
export { ACCENT_DECORATIONS, AccentText } from './blocks/accent';
export type { AccentDecoration } from './blocks/accent';
export { Icon, readIcon } from './blocks/shared';
