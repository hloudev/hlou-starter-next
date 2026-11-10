/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { MotionRuntime } from './runtime';

/*
 * PREVIEW'S REMOTE CONTROL: « Replay animations » and « Simulate
 * reduced motion » reach a page's motion runtime two ways.
 *
 * - A page Hlou serves itself (the draft, a build rendered by `/p`) is
 *   same-origin with Preview, which calls `window.__hlMotion` directly.
 * - A hosted build, or a build with hand-written code, is framed by `/p` on
 *   its own origin: nothing reaches its DOM. Preview posts a
 *   message to that frame instead, and the `motion` island answers it — only
 *   from its direct parent, and only from an origin it trusts:
 *
 *       parent → page   { type: 'hl:motion', action: 'ping' }
 *                       { type: 'hl:motion', action: 'replay' }
 *                       { type: 'hl:motion', action: 'reduced', value: true | false | null }
 *       page → parent   { type: 'hl:motion', action: 'ready', reduced: true | false | null }
 *
 *   `ready` answers a `ping`, posted to the asking origin only: Preview shows
 *   its motion tools once a page has answered.
 *
 * The trusted origins: the page's own; the Hlou control plane the build posts
 * its forms to (`formEndpoint`'s origin, `apiUrl` at build time); and, on a
 * page served from a local host, any local host (a dev site framed by the dev
 * app). Zod-free: it ships in the island.
 */

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export const MOTION_MESSAGE_TYPE = 'hl:motion';

export type MotionCommand =
  | { type: typeof MOTION_MESSAGE_TYPE; action: 'ping' }
  | { type: typeof MOTION_MESSAGE_TYPE; action: 'replay' }
  | { type: typeof MOTION_MESSAGE_TYPE; action: 'reduced'; value: boolean | null };

export type MotionReady = {
  type: typeof MOTION_MESSAGE_TYPE;
  action: 'ready';
  /** The reduced motion Preview forces (`null`: the visitor's own preference). */
  reduced: boolean | null;
};

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** A message's command, or null when it is not one of ours, or malformed. */
export function readMotionCommand(data: unknown): MotionCommand | null {
  if (!isRecord(data) || data.type !== MOTION_MESSAGE_TYPE) return null;
  switch (data.action) {
    case 'ping':
      return { type: MOTION_MESSAGE_TYPE, action: 'ping' };
    case 'replay':
      return { type: MOTION_MESSAGE_TYPE, action: 'replay' };
    case 'reduced':
      return typeof data.value === 'boolean' || data.value === null
        ? { type: MOTION_MESSAGE_TYPE, action: 'reduced', value: data.value }
        : null;
    default:
      return null;
  }
}

/** A `ready` answer, or null. */
export function readMotionReady(data: unknown): MotionReady | null {
  if (!isRecord(data) || data.type !== MOTION_MESSAGE_TYPE || data.action !== 'ready') return null;
  const reduced = typeof data.reduced === 'boolean' ? data.reduced : null;
  return { type: MOTION_MESSAGE_TYPE, action: 'ready', reduced };
}

/** `https://hlou.site` from an absolute http(s) URL; null otherwise (a relative path). */
export function originOf(url: string | null | undefined): string | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** The origins a render's endpoints name: where its control plane is. */
export function motionOrigins(...endpoints: ReadonlyArray<string | null | undefined>): string[] {
  const origins = endpoints.map(originOf).filter((origin): origin is string => origin !== null);
  return [...new Set(origins)];
}

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$/i;

function hostOf(origin: string): string | null {
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

const isLocal = (origin: string): boolean => LOCAL_HOST.test(hostOf(origin) ?? '');

/**
 * Whether a message from `origin` may drive the page at `self`: the page's
 * own origin, one it was given (`allowed`), or — a local page only — any
 * local origin.
 */
export function motionOriginAllowed(
  origin: string,
  self: string,
  allowed: readonly string[] = []
): boolean {
  if (!origin || origin === 'null') return false;
  if (origin === self) return true;
  if (allowed.includes(origin)) return true;
  return isLocal(self) && isLocal(origin);
}

/** Back to the top, then every appearance again: what « Replay animations » means. */
export function replayMotion(runtime: Pick<MotionRuntime, 'replay'>, win: Window | null): void {
  win?.scrollTo(0, 0);
  runtime.replay();
}

/* -------------------------------------------------------------------------- */
/*                                  LISTENER                                  */
/* -------------------------------------------------------------------------- */

/**
 * The island's side: answers Preview's commands from its direct parent at a
 * trusted origin, and nothing else. Returns the unsubscribe. A page that is
 * not framed never listens.
 */
export function listenForMotionCommands(
  win: Window,
  runtime: Pick<MotionRuntime, 'replay' | 'setReducedMotion'>,
  allowed: readonly string[] = []
): () => void {
  if (win.parent === win) return () => {};
  let reduced: boolean | null = null;
  const onMessage = (event: MessageEvent) => {
    if (event.source !== win.parent) return;
    if (!motionOriginAllowed(event.origin, win.location.origin, allowed)) return;
    const command = readMotionCommand(event.data);
    if (!command) return;
    switch (command.action) {
      case 'ping': {
        const ready: MotionReady = { type: MOTION_MESSAGE_TYPE, action: 'ready', reduced };
        (event.source as Window).postMessage(ready, event.origin);
        return;
      }
      case 'replay':
        replayMotion(runtime, win);
        return;
      case 'reduced':
        reduced = command.value;
        runtime.setReducedMotion(command.value);
        return;
    }
  };
  win.addEventListener('message', onMessage);
  return () => win.removeEventListener('message', onMessage);
}
