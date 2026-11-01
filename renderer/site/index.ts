/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

/*
 * The chrome around a rendered site — document head, routes, sitemap, robots,
 * manifest, redirects, the 404, the social card — framework-free, so every
 * build method adapts the same functions instead of re-implementing them.
 */
export { absoluteUrl, createSiteEnv, resolveSiteUrl } from './env';
export type { SiteEnv, SiteEnvInput, SiteEnvironment } from './env';
export { escapeHtml, headTagsToHtml, htmlAttrsToHtml } from './head';
export type { HeadTag } from './head';
export {
  DEFAULT_SHARE_IMAGE,
  getLocaleInfo,
  getIconSource,
  getMedia,
  getRecordText,
  getShareImage,
  getSiteDescription,
  getSiteLogo,
  getSiteName,
  getSiteTagline,
  getSlotMedia,
  getSlotText,
  getSourceLocale,
  hasSvgIcon,
  localePath,
  pathToSlug,
  resolveRoute,
  siteRoutes,
  slugToPath,
  themeColor,
  themeColorValue,
} from './routes';
export type { ResolvedRoute, ShareImage, SiteRoute } from './routes';
/* For the builder's generated icons, which pick a legible ink (`./site` is its entry). */
export { contrastRatio } from '../theme/scheme';
export {
  layoutMetadata,
  pageJsonLd,
  pageMetadata,
  pageSeo,
  rootStubHead,
  rootStubMetadata,
  siteDocument,
  siteHtmlAttrs,
  siteRobots,
  siteViewport,
} from './seo';
export type { PageSeo, SiteHtmlAttrs, SiteMetadata, SiteViewport } from './seo';
export { organizationJsonLd, serializeJsonLd, webPageJsonLd, webSiteJsonLd } from './jsonld';
export type { JsonLd } from './jsonld';
export { formEndpointBase, HONEYPOT_FIELD } from './forms';
export { robotsData, robotsTxt, sitemapEntries, sitemapXml, webManifest } from './files';
export type { RobotsData, SitemapEntry, WebManifest } from './files';
export { redirectStubs } from './redirects';
export type { RedirectStub } from './redirects';
export { socialProfileUrl, socialProfileUrls, xHandle } from './social';
export { analyticsTags } from './analytics';
export { resolveAttribution, suggestAttribution } from './attribution';
export { attributionFooter } from './attribution-footer';
export type { AttributionFooter } from './attribution-footer';
export type {
  AttributionFooterTheme,
  AttributionPalette,
  AttributionReason,
  AttributionSuggestion,
  AttributionSuggestionInput,
} from './attribution';
export {
  ATTRIBUTION_TONE_SIDES,
  AttributionBadge,
  attributionBadgeVars,
  attributionSides,
  HLOU_ATTRIBUTION_HREF,
} from './attribution-badge';
export type {
  AttributionBadgeProps,
  AttributionMarkKind,
  AttributionPlacement,
  AttributionShadowLayer,
  AttributionToneSide,
  AttributionToneSideKey,
} from './attribution-badge';
export { attributionMessages, chromeMessages, nightsMessages, stateMessages } from './messages';
export type { AttributionMessages, ChromeMessages, StateMessages } from './messages';
export { NotFoundBody, RedirectBody, SiteChrome, SITE_BODY_CLASS } from './chrome';
export { ogImage } from './og';
export type { ElementFactory } from './og';
