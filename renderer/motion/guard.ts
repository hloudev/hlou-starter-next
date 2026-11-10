/*
 * CONTENT IS NEVER LOST TO MOTION (decision 321). An element that appears
 * (`enter`, `text`) is pre-hidden only once a script has said a runtime is
 * coming: an inline head script sets `<html data-hl-motion="on">` before the
 * first paint, and `site.css` hides the elements that will appear under it.
 * Then:
 *
 * - the runtime takes over (`live`) and releases each element as it plays
 *   it (`data-hl-motion-ready`);
 * - if the runtime never runs (its chunk failed, a script error), the head
 *   script's failsafe sets `done` after 2.5 s and everything shows;
 * - with no JavaScript, nothing is ever set: the page is static and complete;
 * - a visitor who asks for reduced motion on a site whose policy is `off`
 *   gets no pre-hiding at all.
 *
 * Every head that renders a site carries the script: the starter's layout,
 * the kernel's documents, the app's `/p` and `/s` layouts. Pure strings, no
 * dependency.
 */

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** On `<html>`: `on` (a runtime is coming), `live` (it runs), `done` (show everything). */
export const MOTION_STATE_ATTRIBUTE = 'data-hl-motion';
export type MotionPageState = 'on' | 'live' | 'done';
/** On an element: its appearance is released (played, or nothing to play). */
export const MOTION_READY_ATTRIBUTE = 'data-hl-motion-ready';
/** How long the page waits for the runtime before showing everything. */
export const MOTION_FAILSAFE_MS = 2500;

/**
 * The elements `site.css` pre-hides: a `data-hl-motion` whose compact JSON
 * (`motion/compile.ts`, `MOTION_SHORT_KEYS`) carries `enter` (`"e":`) or
 * `text` (`"t":`), not yet released, under a page in state `on` or `live`.
 * A key is never a value's prefix: values are quoted and followed by `,`/`}`.
 */
export const MOTION_PREHIDE_SELECTOR =
  `html:is([${MOTION_STATE_ATTRIBUTE}='on'], [${MOTION_STATE_ATTRIBUTE}='live']) ` +
  `:is([${MOTION_STATE_ATTRIBUTE}*='"e":'], [${MOTION_STATE_ATTRIBUTE}*='"t":'])` +
  `:not([${MOTION_READY_ATTRIBUTE}])`;

/**
 * The rule `site.css` carries (`guard.test.ts` holds the two together).
 * Important: the rule sits in the `hl-site` layer, under `utilities`, so a
 * designer's opacity utility on the element would otherwise win and show
 * it before its appearance plays. An important declaration of an earlier
 * layer beats a later layer's; it lasts only until the runtime releases the
 * element (its first frame drawn), so it never fights the animation.
 */
export const MOTION_GUARD_CSS = `${MOTION_PREHIDE_SELECTOR} { opacity: 0 !important; }`;

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * The inline head script, for a site whose reduced-motion policy is
 * `policy` (`themeMotion(theme).reducedMotion`). Never throws.
 */
export function motionGuardScript(policy: 'reduce' | 'off' = 'reduce'): string {
  const skip =
    policy === 'off' ? "if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;" : '';
  return (
    `(function(){try{var d=document.documentElement;${skip}` +
    `d.setAttribute('${MOTION_STATE_ATTRIBUTE}','on');` +
    `setTimeout(function(){if(d.getAttribute('${MOTION_STATE_ATTRIBUTE}')==='on')` +
    `d.setAttribute('${MOTION_STATE_ATTRIBUTE}','done')},${MOTION_FAILSAFE_MS})}catch(e){}})()`
  );
}

/** The script for the default policy, `reduce`. */
export const MOTION_GUARD_SCRIPT = motionGuardScript('reduce');
