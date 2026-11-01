/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

/* The site spec, format 1 (M43, decision 219): defined here, beside the blocks
   and the document it validates against, and re-exported as
   `@hlou/contracts/site-spec`. Nothing else defines the format. */
export * from './paths';
export * from './schema';
export * from './lock';
export * from './validate';
export * from './block-props';
export * from './json-schema';
/* The starter's compiler (M43-03): spec → `SiteSnapshot`. */
export * from './compile';
