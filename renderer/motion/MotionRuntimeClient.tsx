'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useEffect } from 'react';

import type { MotionPersonality } from './personality';
import type { MotionRuntime } from './runtime';
import { listenForMotionCommands } from './bridge';
import { createMotionRuntime } from './runtime';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type MotionRuntimeClientProps = {
  /** The site's motion personality (`themeMotion(theme)`), resolved server-side. */
  personality: MotionPersonality;
  /** The page's reading direction, where an element's ancestors say none. */
  dir: 'ltr' | 'rtl';
  /**
   * Origins besides the page's own whose Preview may replay its motion or
   * simulate reduced motion by message (`bridge.ts`): the control plane's.
   */
  origins?: string[];
};

declare global {
  interface Window {
    /** The page's motion runtime, for Preview's controls (MO7). */
    __hlMotion?: MotionRuntime;
  }
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * The `motion` island: renders nothing, and on mount runs the
 * page runtime over the whole document in `live` mode. `SiteRender` renders
 * it once, at the end of a page that carries motion, never in the canvas
 * (which runs its own, MO5). The runtime is `window.__hlMotion` while it
 * lives, so a same-origin Preview can replay it or simulate reduced motion;
 * a framed page answers the same commands by message (`bridge.ts`).
 */
export function MotionRuntimeClient({ personality, dir, origins }: MotionRuntimeClientProps): null {
  /* Props are server JSON: the keys keep one runtime per personality. */
  const key = JSON.stringify(personality);
  const allowed = (origins ?? []).join(' ');
  useEffect(() => {
    const runtime = createMotionRuntime({
      root: document,
      mode: 'live',
      personality: JSON.parse(key) as MotionPersonality,
      dir,
    });
    window.__hlMotion = runtime;
    const stopListening = listenForMotionCommands(
      window,
      runtime,
      allowed ? allowed.split(' ') : []
    );
    return () => {
      stopListening();
      runtime.dispose();
      if (window.__hlMotion === runtime) delete window.__hlMotion;
    };
  }, [key, dir, allowed]);
  return null;
}
