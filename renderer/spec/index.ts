/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

/* The site spec, format 1: defined here, beside the blocks
   and the document it validates against. Nothing else defines the format. */
export * from './paths';
export * from './schema';
export * from './lock';
export * from './validate';
export * from './block-props';
export * from './json-schema';
/* The starter's compiler: spec → `SiteSnapshot`. */
export * from './compile';
