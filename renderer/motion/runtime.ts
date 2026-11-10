/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import { animate, hover, inView, press, scroll, stagger } from 'motion';

import type { AnimationOptions, DOMKeyframesDefinition } from 'motion';
import type { MotionPersonality } from './personality';
import type { ResolvedMotion } from './resolve';
import type { SplitText } from './split-text';
import { checkMotionAttribute } from './check';
import { MOTION_READY_ATTRIBUTE, MOTION_STATE_ATTRIBUTE } from './guard';
import { DEFAULT_MOTION_PERSONALITY, resolveMotion } from './resolve';
import { splitText } from './split-text';

/*
 * THE PAGE RUNTIME (decisions 319, 321, 323): the one thing that plays a
 * `data-hl-motion` attribute, on the `motion` library's vanilla API. Built
 * sites (`next`, `kernel`) and Preview run it in `live` mode through the
 * `motion` island (`MotionRuntimeClient`); the Canvas runs it itself in
 * `canvas` mode (MO5).
 *
 * `live`: every element is resolved against the site's personality and the
 * visitor's environment, then wired — enter on load or in view (`inView`),
 * hover / press gestures, loops that pause off screen, scroll-linked
 * animations, text split and staggered. It releases the guard's pre-hiding
 * (`guard.ts`) element by element.
 *
 * `canvas`: nothing triggers on its own (frames are full height, the overlay
 * takes the pointer); every element rests at its final state until the
 * editor calls `play`, `replay`, `scrub` or `pinHover`.
 *
 * Whatever it does to an element it undoes: `rest` and `dispose` cancel
 * every animation, put split text back and restore the inline properties it
 * touched. Zod-free (`check.ts` validates the attribute by hand).
 */

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type MotionRuntimeMode = 'live' | 'canvas';

/** The parts the runtime can play, scrub or rest one by one. */
export type MotionRuntimePart = 'enter' | 'text' | 'hover' | 'press' | 'loop' | 'scroll';

export type MotionRuntimeOptions = {
  /** What to scan for `[data-hl-motion]`: a document (a page, a frame) or an element. */
  root: Document | Element;
  mode: MotionRuntimeMode;
  /** The site's personality (`themeMotion(theme)`); calm by default. */
  personality?: MotionPersonality;
  /** Force reduced motion on or off; left out, the visitor's preference rules. */
  reducedMotion?: boolean;
  /** The reading direction where no ancestor of an element says (`dir`). */
  dir?: 'ltr' | 'rtl';
};

export type MotionRuntime = {
  readonly mode: MotionRuntimeMode;
  /**
   * Plays every appearance again. `live`: back to the page's first state —
   * hidden until in view (or on load), as on arrival. `canvas`: plays every
   * `enter` / `text` at once, each with its own delay.
   */
  replay: () => void;
  /** Plays one element: `part`, or its appearance, else its loop, scroll, hover, press. */
  play: (element: Element, part?: MotionRuntimePart) => void;
  /**
   * Holds one element at `t` (0–1) of a part — `part`, else its scroll, its
   * appearance, its loop — paused there until `play`, `rest` or a refresh.
   * Delays are left out: `t` runs over the movement itself.
   */
  scrub: (element: Element, t: number, part?: MotionRuntimePart) => void;
  /** Holds an element in its hover state (`on`) or lets it go back to rest. */
  pinHover: (element: Element, on: boolean) => void;
  /** Freezes every running animation where it is; new ones start frozen. */
  pause: () => void;
  /** Lets what `pause` froze run again. */
  resume: () => void;
  /** Ends every animation (or one element's) and rests it at its final state. */
  rest: (element?: Element) => void;
  /** Rescans the root after DOM changes: new, changed and removed elements. */
  refresh: () => void;
  /** Forces reduced motion (`true` / `false`) or follows the visitor again (`null`). */
  setReducedMotion: (value: boolean | null) => void;
  /** Stops everything, restores every element and shows the page. */
  dispose: () => void;
};

/** What Motion hands back: the playback controls this runtime uses. */
type Controls = {
  time: number;
  duration: number;
  play: () => void;
  pause: () => void;
  cancel: () => void;
  finished: Promise<unknown>;
};

type Entry = {
  element: HTMLElement;
  attribute: string;
  resolved: ResolvedMotion;
  /** Its `media` matches the viewport: wired. */
  active: boolean;
  stops: Array<() => void>;
  animations: Map<MotionRuntimePart, Controls>;
  split?: SplitText;
  pinned: boolean;
  /** Loops and scroll wait for the appearance (the same properties would fight). */
  afterEnter: Array<() => void>;
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const ATTRIBUTE = MOTION_STATE_ATTRIBUTE;
const SELECTOR = `[${ATTRIBUTE}]`;
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
/** `media` → the viewport it plays at: `md` and `lg` of `blocks/tw.ts`. */
const MEDIA_QUERIES = {
  'no-mobile': '(min-width: 768px)',
  desktop: '(min-width: 1180px)',
} as const;
/**
 * The inline properties Motion may write, restored as they were found. Only
 * these: the element's other inline styles belong to whoever rendered it.
 */
const TOUCHED = [
  'opacity',
  'transform',
  'translate',
  'scale',
  'rotate',
  'filter',
  'clip-path',
  'transform-origin',
  'will-change',
] as const;
/** A canvas `play` of a scroll part: one pass, in seconds. */
const SCROLL_PREVIEW = 1.2;

/** Live runtimes per document: the last one disposed shows the page. */
const liveRuntimes = new WeakMap<Document, number>();

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

const isElement = (node: unknown): node is HTMLElement =>
  typeof node === 'object' && node !== null && (node as Node).nodeType === 1;

const isDocument = (root: Document | Element): root is Document => root.nodeType === 9;

/** The `[from, …]` keyframes' first values: the state before the movement. */
function firstFrame(
  keyframes: Partial<Record<string, Array<number | string>>>
): Record<string, number | string> {
  const out: Record<string, number | string> = {};
  for (const [key, values] of Object.entries(keyframes)) {
    const first = values?.[0];
    if (first !== undefined) out[key] = first;
  }
  return out;
}

/** Keyframes plus what must be set before them (`transformPerspective` for a 3D turn). */
function withSet(
  keyframes: Record<string, unknown>,
  set: { transformPerspective?: number } | undefined
): DOMKeyframesDefinition {
  return (
    set?.transformPerspective !== undefined
      ? { ...keyframes, transformPerspective: set.transformPerspective }
      : keyframes
  ) as DOMKeyframesDefinition;
}

const options = (value: unknown): AnimationOptions => value as AnimationOptions;

const withoutDelay = <T extends { delay?: number }>(value: T): T => {
  const { delay: _delay, ...rest } = value;
  return rest as T;
};

/* -------------------------------------------------------------------------- */
/*                                   RUNTIME                                  */
/* -------------------------------------------------------------------------- */

export function createMotionRuntime(config: MotionRuntimeOptions): MotionRuntime {
  const { root, mode } = config;
  const personality = config.personality ?? DEFAULT_MOTION_PERSONALITY;
  const doc = isDocument(root) ? root : root.ownerDocument;
  const view = doc.defaultView;
  const html = doc.documentElement;

  const entries = new Map<HTMLElement, Entry>();
  /** Elements whose appearance has played (or was skipped): never hidden again but by `replay`. */
  const played = new WeakSet<HTMLElement>();
  /** Each touched element's inline properties as found, and its `tabindex` (press). */
  const saved = new Map<HTMLElement, { style: Map<string, string>; tabindex?: string | null }>();
  const running = new Set<Controls>();
  let frozen: Set<Controls> | null = null;
  let forcedReduced: boolean | null = config.reducedMotion ?? null;
  let disposed = false;

  const media = (query: string) => view?.matchMedia?.(query) ?? null;
  const reducedQuery = media(REDUCED_QUERY);
  const reduced = () => forcedReduced ?? reducedQuery?.matches ?? false;

  /* ------------------------------ BOOKKEEPING ----------------------------- */

  function touch(element: HTMLElement): void {
    if (saved.has(element)) return;
    const style = new Map<string, string>();
    for (const property of TOUCHED) style.set(property, element.style.getPropertyValue(property));
    saved.set(element, { style });
  }

  function restore(element: HTMLElement): void {
    const found = saved.get(element);
    if (!found) return;
    for (const [property, value] of found.style) {
      if (value) element.style.setProperty(property, value);
      else element.style.removeProperty(property);
    }
    if (element.getAttribute('style') === '') element.removeAttribute('style');
    if (found.tabindex !== undefined) {
      if (found.tabindex === null) element.removeAttribute('tabindex');
      else element.setAttribute('tabindex', found.tabindex);
    }
    saved.delete(element);
  }

  function track(entry: Entry, part: MotionRuntimePart, controls: Controls): Controls {
    entry.animations.get(part)?.cancel();
    entry.animations.set(part, controls);
    running.add(controls);
    if (frozen) {
      controls.pause();
      frozen.add(controls);
    }
    const settle = () => {
      running.delete(controls);
      if (entry.animations.get(part) === controls) entry.animations.delete(part);
    };
    controls.finished.then(settle, settle);
    return controls;
  }

  function cancel(entry: Entry, part?: MotionRuntimePart): void {
    for (const [key, controls] of [...entry.animations]) {
      if (part && key !== part) continue;
      controls.cancel();
      running.delete(controls);
      frozen?.delete(controls);
      entry.animations.delete(key);
    }
  }

  function revertSplit(entry: Entry): void {
    entry.split?.revert();
    entry.split = undefined;
  }

  /** Shows an element the guard hid: now, or once its first frame is drawn. */
  function release(element: HTMLElement, afterFrames = false): void {
    if (mode !== 'live') return;
    played.add(element);
    const mark = () => element.setAttribute(MOTION_READY_ATTRIBUTE, '');
    if (!afterFrames || !view?.requestAnimationFrame) {
      mark();
      return;
    }
    /* Motion resolves keyframes on its next frame: two frames and the
       first one is on screen, so the element never flashes at rest. */
    view.requestAnimationFrame(() => view.requestAnimationFrame(mark));
  }

  function dirOf(element: HTMLElement): 'ltr' | 'rtl' {
    const own = element.closest('[dir]')?.getAttribute('dir');
    if (own === 'rtl' || own === 'ltr') return own;
    return config.dir ?? 'ltr';
  }

  /* -------------------------------- PLAYING ------------------------------- */

  function flushAfterEnter(entry: Entry): void {
    const waiting = entry.afterEnter.splice(0);
    for (const run of waiting) run();
  }

  /** The appearance: `enter` (on itself, or its children with `stagger`) and `text`. */
  function playEnter(entry: Entry, { scrubbing = false } = {}): Controls[] {
    const { element, resolved } = entry;
    const { enter, text, stagger: staggered } = resolved;
    cancel(entry, 'enter');
    cancel(entry, 'text');
    revertSplit(entry);
    const out: Controls[] = [];

    if (enter) {
      const timing = scrubbing ? withoutDelay(enter.options) : enter.options;
      const keyframes = withSet(enter.keyframes, enter.set);
      const children = staggered
        ? [...element.children].filter(
            (child): child is HTMLElement =>
              isElement(child) && !(child.getAttribute(ATTRIBUTE) ?? '').includes('"e":')
          )
        : [];
      if (staggered && children.length > 0) {
        children.forEach(touch);
        out.push(
          track(
            entry,
            'enter',
            animate(
              children,
              keyframes,
              options({
                ...timing,
                delay: stagger(staggered.each, {
                  startDelay: timing.delay ?? 0,
                  from: staggered.from,
                }),
              })
            )
          )
        );
      } else {
        touch(element);
        out.push(track(entry, 'enter', animate(element, keyframes, options(timing))));
      }
    }

    const split = text ? splitText(element, text.split) : undefined;
    if (split && split.pieces.length === 0) split.revert();
    if (text && split && split.pieces.length > 0) {
      entry.split = split;
      const timing = scrubbing ? withoutDelay(text.options) : text.options;
      const start = scrubbing ? 0 : (enter?.options.delay ?? text.options.delay ?? 0);
      const delay =
        text.split === 'lines'
          ? (index: number) => start + (split.lineOf[index] ?? 0) * text.stagger
          : stagger(text.stagger, { startDelay: start });
      const controls = track(
        entry,
        'text',
        animate(
          split.pieces,
          text.keyframes as DOMKeyframesDefinition,
          options({ ...timing, delay })
        )
      );
      /* Back to the plain text once it has played: nothing stays cut. */
      if (!scrubbing) {
        controls.finished.then(
          () => entry.split === split && revertSplit(entry),
          () => undefined
        );
      }
      out.push(controls);
    }

    if (!scrubbing) {
      release(element, out.length > 0);
      const last = out.at(-1);
      if (last)
        last.finished.then(
          () => flushAfterEnter(entry),
          () => undefined
        );
      else flushAfterEnter(entry);
    }
    return out;
  }

  /** Back to the state before the appearance, to play it again (`once: false`). */
  function resetEnter(entry: Entry): void {
    const { element, resolved } = entry;
    cancel(entry, 'enter');
    cancel(entry, 'text');
    revertSplit(entry);
    const enter = resolved.enter;
    if (!enter) return;
    const targets = resolved.stagger
      ? [...element.children].filter((child): child is HTMLElement => isElement(child))
      : [element];
    targets.forEach(touch);
    animate(targets, firstFrame(enter.keyframes) as DOMKeyframesDefinition, { duration: 0 });
  }

  function startLoop(entry: Entry, { cycle = false } = {}): Controls | undefined {
    const loop = entry.resolved.loop;
    if (!loop) return undefined;
    touch(entry.element);
    const timing = cycle
      ? { ...loop.options, repeat: loop.options.repeatType === 'mirror' ? 1 : 0 }
      : loop.options;
    return track(
      entry,
      'loop',
      animate(entry.element, withSet(loop.keyframes, loop.set), options(timing))
    );
  }

  function scrollAnimation(entry: Entry, duration: number): Controls | undefined {
    const linked = entry.resolved.scroll;
    if (!linked) return undefined;
    touch(entry.element);
    return track(
      entry,
      'scroll',
      animate(entry.element, linked.keyframes as DOMKeyframesDefinition, {
        duration,
        ease: 'linear',
      })
    );
  }

  function gesture(entry: Entry, part: 'hover' | 'press', on: boolean): void {
    const resolved = entry.resolved[part];
    if (!resolved) return;
    touch(entry.element);
    track(
      entry,
      part,
      animate(
        entry.element,
        withSet(on ? resolved.to : resolved.rest, resolved.set),
        options(resolved.options)
      )
    );
  }

  /* -------------------------------- WIRING -------------------------------- */

  function wireLive(entry: Entry): void {
    const { element, resolved } = entry;
    const { enter, text, loop } = resolved;

    /* Loops run while on screen; scroll follows the page. Both after the
       appearance, which animates the same properties. */
    if (loop) {
      entry.afterEnter.push(() => {
        const controls = startLoop(entry);
        if (!controls) return;
        controls.pause();
        entry.stops.push(
          inView(
            element,
            () => {
              if (frozen) frozen.add(controls);
              else controls.play();
              return () => controls.pause();
            },
            { amount: 'some' }
          )
        );
      });
    }
    if (resolved.scroll) {
      const offset = resolved.scroll.offset;
      entry.afterEnter.push(() => {
        const controls = scrollAnimation(entry, 1);
        if (!controls) return;
        entry.stops.push(
          scroll(controls as Parameters<typeof scroll>[0], {
            target: element,
            offset: [...offset],
          })
        );
      });
    }

    if (resolved.hover) {
      entry.stops.push(
        hover(element, () => {
          if (!entry.pinned) gesture(entry, 'hover', true);
          return () => {
            if (!entry.pinned) gesture(entry, 'hover', false);
          };
        })
      );
    }
    if (resolved.press) {
      /* `press` makes the element focusable: give its tabindex back on dispose. */
      touch(element);
      const found = saved.get(element);
      if (found && found.tabindex === undefined) found.tabindex = element.getAttribute('tabindex');
      entry.stops.push(
        press(element, () => {
          gesture(entry, 'press', true);
          return () => gesture(entry, 'press', false);
        })
      );
    }

    /* The appearance. */
    if ((!enter && !text) || played.has(element)) {
      release(element);
      flushAfterEnter(entry);
      return;
    }
    if (enter?.trigger === 'load') {
      playEnter(entry);
      return;
    }
    const once = enter?.once ?? true;
    const watch: { stop?: () => void; done: boolean } = { done: false };
    watch.stop = inView(
      element,
      () => {
        if (watch.done) return undefined;
        playEnter(entry);
        if (once) {
          watch.done = true;
          watch.stop?.();
          return undefined;
        }
        return () => resetEnter(entry);
      },
      {
        amount: enter?.amount ?? 0.2,
        ...(enter?.margin ? { margin: enter.margin as `${number}px` } : {}),
      }
    );
    entry.stops.push(() => watch.stop?.());
  }

  function wire(entry: Entry): void {
    if (!entry.active) {
      release(entry.element);
      return;
    }
    if (mode === 'live') wireLive(entry);
  }

  /** Undoes everything an entry did, leaving the element at its natural state. */
  function unwire(entry: Entry): void {
    for (const stop of entry.stops.splice(0)) stop();
    entry.afterEnter.length = 0;
    cancel(entry);
    revertSplit(entry);
    entry.pinned = false;
    restore(entry.element);
    for (const child of entry.element.children) if (isElement(child)) restore(child);
  }

  function build(element: HTMLElement, attribute: string): Entry {
    const spec = checkMotionAttribute(attribute);
    const resolved = resolveMotion(spec, personality, {
      reducedMotion: reduced(),
      dir: dirOf(element),
    });
    const query = resolved.media === 'all' ? null : media(MEDIA_QUERIES[resolved.media]);
    return {
      element,
      attribute,
      resolved,
      active: query ? query.matches : true,
      stops: [],
      animations: new Map(),
      pinned: false,
      afterEnter: [],
    };
  }

  /** The elements under the root that carry motion (never `<html>`'s state). */
  function scan(): Map<HTMLElement, string> {
    const found = new Map<HTMLElement, string>();
    const candidates = [
      ...(isElement(root) && root.hasAttribute(ATTRIBUTE) ? [root] : []),
      ...root.querySelectorAll<HTMLElement>(SELECTOR),
    ];
    for (const element of candidates) {
      if (element === html) continue;
      const attribute = element.getAttribute(ATTRIBUTE) ?? '';
      if (attribute.trimStart().startsWith('{')) found.set(element, attribute);
    }
    return found;
  }

  function refresh(): void {
    if (disposed) return;
    const found = scan();
    for (const [element, entry] of entries) {
      if (found.get(element) === entry.attribute && element.isConnected) continue;
      unwire(entry);
      entries.delete(element);
    }
    for (const [element, attribute] of found) {
      if (entries.has(element)) continue;
      const entry = build(element, attribute);
      entries.set(element, entry);
      wire(entry);
    }
  }

  /** Every entry built again (the environment changed): what played stays shown. */
  function rebuild(): void {
    for (const entry of entries.values()) unwire(entry);
    entries.clear();
    refresh();
  }

  function entryOf(element: Element): Entry | undefined {
    return isElement(element) ? entries.get(element) : undefined;
  }

  /* ------------------------------ ENVIRONMENT ----------------------------- */

  const listeners: Array<() => void> = [];
  const onChange = () => rebuild();
  for (const query of [reducedQuery, ...Object.values(MEDIA_QUERIES).map(media)]) {
    if (!query?.addEventListener) continue;
    query.addEventListener('change', onChange);
    listeners.push(() => query.removeEventListener('change', onChange));
  }

  /* --------------------------------- START -------------------------------- */

  if (mode === 'live') {
    liveRuntimes.set(doc, (liveRuntimes.get(doc) ?? 0) + 1);
    /* Arrived after the guard's failsafe showed everything: what is on the
       page now is shown, and hiding it again would flash. */
    if (html.getAttribute(ATTRIBUTE) === 'done') {
      for (const element of scan().keys()) played.add(element);
    }
  }
  refresh();
  if (mode === 'live' && html.getAttribute(ATTRIBUTE) !== 'done') {
    html.setAttribute(ATTRIBUTE, 'live');
  }

  /* ---------------------------------- API --------------------------------- */

  return {
    mode,
    replay() {
      if (disposed) return;
      if (mode === 'canvas') {
        for (const entry of entries.values()) {
          if (entry.active && (entry.resolved.enter || entry.resolved.text)) playEnter(entry);
        }
        return;
      }
      for (const entry of entries.values()) {
        unwire(entry);
        played.delete(entry.element);
        entry.element.removeAttribute(MOTION_READY_ATTRIBUTE);
      }
      entries.clear();
      html.setAttribute(ATTRIBUTE, 'live');
      refresh();
    },

    play(element, part) {
      const entry = entryOf(element);
      if (!entry || disposed) return;
      const { resolved } = entry;
      const pick =
        part ??
        (resolved.enter
          ? 'enter'
          : resolved.text
            ? 'text'
            : resolved.loop
              ? 'loop'
              : resolved.scroll
                ? 'scroll'
                : resolved.hover
                  ? 'hover'
                  : resolved.press
                    ? 'press'
                    : undefined);
      if (!pick) return;
      switch (pick) {
        case 'enter':
        case 'text':
          playEnter(entry);
          return;
        case 'loop': {
          const controls = startLoop(entry, { cycle: mode === 'canvas' });
          if (mode === 'canvas')
            controls?.finished.then(
              () => restore(entry.element),
              () => undefined
            );
          return;
        }
        case 'scroll': {
          if (mode === 'live') return;
          const controls = scrollAnimation(entry, SCROLL_PREVIEW);
          controls?.finished.then(
            () => restore(entry.element),
            () => undefined
          );
          return;
        }
        case 'hover':
        case 'press': {
          gesture(entry, pick, true);
          const controls = entry.animations.get(pick);
          controls?.finished.then(
            () => !entry.pinned && gesture(entry, pick, false),
            () => undefined
          );
          return;
        }
      }
    },

    scrub(element, t, part) {
      const entry = entryOf(element);
      if (!entry || disposed) return;
      const { resolved } = entry;
      const pick =
        part ??
        (resolved.scroll
          ? 'scroll'
          : resolved.enter || resolved.text
            ? 'enter'
            : resolved.loop
              ? 'loop'
              : undefined);
      const progress = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));
      let held: Controls[] = [];
      if (pick === 'scroll') {
        const controls = scrollAnimation(entry, 1);
        held = controls ? [controls] : [];
      } else if (pick === 'enter' || pick === 'text') {
        held = playEnter(entry, { scrubbing: true });
      } else if (pick === 'loop') {
        const controls = startLoop(entry, { cycle: true });
        held = controls ? [controls] : [];
      }
      for (const controls of held) {
        controls.pause();
        controls.time = progress * controls.duration;
        /* Held, not running: `resume` must not set it going. */
        running.delete(controls);
        frozen?.delete(controls);
      }
    },

    pinHover(element, on) {
      const entry = entryOf(element);
      if (!entry || disposed || !entry.resolved.hover) return;
      entry.pinned = on;
      gesture(entry, 'hover', on);
    },

    pause() {
      if (frozen) return;
      frozen = new Set();
      for (const controls of running) {
        controls.pause();
        frozen.add(controls);
      }
    },

    resume() {
      const thawed = frozen;
      frozen = null;
      for (const controls of thawed ?? []) controls.play();
    },

    rest(element) {
      const targets = element ? [entryOf(element)].filter(Boolean) : [...entries.values()];
      for (const entry of targets as Entry[]) {
        cancel(entry);
        revertSplit(entry);
        entry.pinned = false;
        restore(entry.element);
        for (const child of entry.element.children) if (isElement(child)) restore(child);
        release(entry.element);
      }
    },

    refresh,

    setReducedMotion(value) {
      forcedReduced = value;
      if (!disposed) rebuild();
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      for (const stop of listeners.splice(0)) stop();
      for (const entry of entries.values()) unwire(entry);
      entries.clear();
      if (mode !== 'live') return;
      /* Nothing left to release what is still hidden: show the page — unless
         another runtime takes over in the same task (React's strict mode
         mounts an effect twice; a re-render with a new personality). */
      const left = (liveRuntimes.get(doc) ?? 1) - 1;
      liveRuntimes.set(doc, left);
      const show = () => {
        if ((liveRuntimes.get(doc) ?? 0) === 0 && html.getAttribute(ATTRIBUTE) === 'live') {
          html.setAttribute(ATTRIBUTE, 'done');
        }
      };
      if (left === 0) {
        if (view) view.setTimeout(show, 0);
        else show();
      }
    },
  };
}
