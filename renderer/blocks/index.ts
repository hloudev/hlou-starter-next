/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { BlockDefinition } from './types';
import { accordionBlock } from './accordion';
import { articleListBlock } from './articleList';
import { audioBlock } from './audio';
import { buttonBlock } from './button';
import { buttonsBlock } from './buttons';
import { cardsBlock } from './cards';
import { carouselBlock } from './carousel';
import { choiceCardsBlock } from './choiceCards';
import { ctaBandBlock } from './ctaBand';
import { customBlock } from './custom';
import { datePickerBlock } from './datePicker';
import { dividerBlock } from './divider';
import { featureGridBlock } from './featureGrid';
import { filterBarBlock } from './filterBar';
import { floatingBlock } from './floating';
import { footerBlock } from './footer';
import { formBlock } from './form';
import { galleryBlock } from './gallery';
import { gridBlock } from './grid';
import { headerBlock } from './header';
import { headingBlock } from './heading';
import { heroBlock } from './hero';
import { imageBlock } from './image';
import { listBlock } from './list';
import { listingsBlock } from './listings';
import { logoCloudBlock } from './logoCloud';
import { marqueeBlock } from './marquee';
import { mediaTextBlock } from './mediaText';
import { modalBlock } from './modal';
import { pageHeaderBlock } from './pageHeader';
import { quantityBlock } from './quantity';
import { quoteBlock } from './quote';
import { scopeBlock } from './scope';
import { sectionBlock } from './section';
import { shapeBlock } from './shape';
import { spacerBlock } from './spacer';
import { stackBlock } from './stack';
import { statementBlock } from './statement';
import { statsBlock } from './stats';
import { stepsBlock } from './steps';
import { summaryBlock } from './summary';
import { tableBlock } from './table';
import { tabsBlock } from './tabs';
import { textBlock } from './text';
import { themeToggleBlock } from './themeToggle';
import { videoBlock } from './video';

/* -------------------------------------------------------------------------- */
/*                                  REGISTRY                                  */
/* -------------------------------------------------------------------------- */

/**
 * Palette order, shelf by shelf: Layout (containers, spacing), Blocks (the
 * agnostic primitives), Library (the composed sections — chrome first, then
 * the page's reading order). The placeholder is canvas-only and last.
 */
export const BLOCK_KEYS = [
  // layout
  'section',
  'grid',
  'stack',
  'scope',
  'datePicker',
  'quantity',
  'choiceCards',
  'steps',
  'summary',
  'tabs',
  'modal',
  'floating',
  'spacer',
  'divider',
  // blocks
  'heading',
  'text',
  'image',
  'button',
  'buttons',
  'list',
  'table',
  'video',
  'audio',
  'shape',
  'themeToggle',
  // library
  'header',
  'hero',
  'pageHeader',
  'statement',
  'mediaText',
  'stats',
  'filterBar',
  'featureGrid',
  'cards',
  'gallery',
  'carousel',
  'logoCloud',
  'marquee',
  'listings',
  'articleList',
  'quote',
  'accordion',
  'ctaBand',
  'form',
  'custom',
  'footer',
] as const;

export type BlockKey = (typeof BLOCK_KEYS)[number];

export const blockRegistry: Record<BlockKey, BlockDefinition> = {
  section: sectionBlock,
  grid: gridBlock,
  stack: stackBlock,
  scope: scopeBlock,
  quantity: quantityBlock,
  choiceCards: choiceCardsBlock,
  steps: stepsBlock,
  summary: summaryBlock,
  tabs: tabsBlock,
  modal: modalBlock,
  floating: floatingBlock,
  spacer: spacerBlock,
  divider: dividerBlock,
  heading: headingBlock,
  text: textBlock,
  image: imageBlock,
  button: buttonBlock,
  buttons: buttonsBlock,
  list: listBlock,
  table: tableBlock,
  video: videoBlock,
  audio: audioBlock,
  shape: shapeBlock,
  themeToggle: themeToggleBlock,
  datePicker: datePickerBlock,
  header: headerBlock,
  hero: heroBlock,
  pageHeader: pageHeaderBlock,
  statement: statementBlock,
  mediaText: mediaTextBlock,
  stats: statsBlock,
  filterBar: filterBarBlock,
  featureGrid: featureGridBlock,
  cards: cardsBlock,
  gallery: galleryBlock,
  carousel: carouselBlock,
  logoCloud: logoCloudBlock,
  marquee: marqueeBlock,
  listings: listingsBlock,
  articleList: articleListBlock,
  quote: quoteBlock,
  accordion: accordionBlock,
  ctaBand: ctaBandBlock,
  form: formBlock,
  custom: customBlock,
  footer: footerBlock,
};

export function isBlockKey(value: unknown): value is BlockKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(blockRegistry, value);
}

export type {
  BlockDefinition,
  BlockCategory,
  BlockProps,
  RenderMode,
  SiteRenderContext,
} from './types';
export { DEFAULT_RENDER_CONTEXT, RENDER_CONTEXT_METADATA_KEY, readRenderContext } from './types';
export {
  articleListBlock,
  buttonBlock,
  buttonsBlock,
  ctaBandBlock,
  dividerBlock,
  featureGridBlock,
  filterBarBlock,
  floatingBlock,
  footerBlock,
  formBlock,
  gridBlock,
  headerBlock,
  headingBlock,
  heroBlock,
  imageBlock,
  listBlock,
  listingsBlock,
  pageHeaderBlock,
  quoteBlock,
  sectionBlock,
  spacerBlock,
  statsBlock,
  tableBlock,
  textBlock,
  themeToggleBlock,
  videoBlock,
  audioBlock,
};
export { resolveVideoSource } from './video';
export { itemAttr, fieldAttr, SlotArea } from './shared';
