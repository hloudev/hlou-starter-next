'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useEffect, useRef } from 'react';

import type { ReactElement } from 'react';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type CarouselClientProps = {
  /** `scroll`: a snap track the island steps through · `fade`: stacked slides, one active. */
  mode: 'scroll' | 'fade';
  /** Seconds between slides, 0 = off. */
  autoplay: number;
  /** The last slide's « next » rewinds to the first. */
  loop: boolean;
  /** Where a slide lands when stepped to (scroll mode). */
  align: 'start' | 'center';
  /** The pause button's two labels. */
  labels: { pause: string; play: string };
  /** The Design canvas: the block is drawn, never armed. */
  inert: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                   WIRING                                   */
/* -------------------------------------------------------------------------- */

const ACTIVE = 'data-hl-active';
const CURRENT = 'aria-current';
const DISABLED = 'aria-disabled';

/**
 * Arms a carousel's server markup: arrows, dots, the keyboard, a
 * mouse drag and autoplay, on the elements the block marked (`data-hl-c-*`).
 * It only ever changes attributes and the scroll position — never the
 * React-owned children — and reads every element inside `root` that belongs
 * to `root` itself, not to a block nested in it. Returns its teardown.
 */
export function wireCarousel(root: HTMLElement, props: CarouselClientProps): () => void {
  const own = <T extends HTMLElement>(selector: string): T[] =>
    Array.from(root.querySelectorAll<T>(selector)).filter(
      (element) => element.closest('[data-hl-block]') === root
    );
  const track = own('[data-hl-c-track]')[0];
  if (props.inert || !track) return () => undefined;

  const fade = props.mode === 'fade';
  /* A fade stack may hold a badge beside its slides. */
  const slides = () =>
    (Array.from(track.children) as HTMLElement[]).filter(
      (slide) => !fade || slide.hasAttribute('data-hl-c-slide')
    );
  const prev = own('[data-hl-c-prev]')[0];
  const next = own('[data-hl-c-next]')[0];
  const dots = own('[data-hl-c-dot]');
  const play = own<HTMLButtonElement>('[data-hl-c-play]')[0];
  const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const reduced = () => motion?.matches === true;
  const rtl = () => root.closest('[dir]')?.getAttribute('dir') === 'rtl';
  const cleanups: Array<() => void> = [];
  const on = <E extends Event>(
    target: EventTarget,
    type: string,
    fn: (event: E) => void,
    options?: AddEventListenerOptions
  ) => {
    target.addEventListener(type, fn as EventListener, options);
    cleanups.push(() => target.removeEventListener(type, fn as EventListener, options));
  };

  let current = Math.max(0, fade ? slides().findIndex((slide) => slide.hasAttribute(ACTIVE)) : 0);
  const visible = new Set<number>();
  const count = () => slides().length;

  /** How many slides one arrow press moves: the whole slides in view. */
  const page = () => {
    const first = slides()[0];
    const width = first?.getBoundingClientRect().width ?? 0;
    if (fade || width <= 0) return 1;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return Math.max(1, Math.floor((track.clientWidth + gap) / (width + gap)));
  };

  /* Start-aligned, the last whole page starts at `count - page`: no slide
     past it can be the first in view (nor its dot current). */
  const lastStart = () =>
    fade || props.align === 'center' ? count() - 1 : Math.max(0, count() - page());
  const atEnd = () => current >= lastStart() || (!fade && visible.has(count() - 1));

  const refresh = () => {
    const last = lastStart();
    dots.forEach((dot, index) => {
      dot.setAttribute(CURRENT, String(index === current));
      dot.toggleAttribute('hidden', index > last);
    });
    prev?.setAttribute(DISABLED, String(!props.loop && current <= 0));
    next?.setAttribute(DISABLED, String(!props.loop && atEnd()));
  };

  /* Scrolls by the distance between the slide and where it should land: a
     rect delta is the same sign in both directions, unlike `scrollLeft`. */
  const show = (index: number) => {
    const all = slides();
    const target = Math.min(Math.max(index, 0), lastStart());
    const slide = all[target];
    if (!slide) return;
    current = target;
    if (fade) {
      all.forEach((one, at) => one.toggleAttribute(ACTIVE, at === target));
    } else {
      const box = track.getBoundingClientRect();
      const rect = slide.getBoundingClientRect();
      const left =
        props.align === 'center'
          ? rect.left + rect.width / 2 - (box.left + box.width / 2)
          : rtl()
            ? rect.right - box.right
            : rect.left - box.left;
      track.scrollBy?.({ left, behavior: reduced() ? 'auto' : 'smooth' });
    }
    refresh();
  };

  const step = (forward: boolean, wrap = props.loop) => {
    if (forward) show(atEnd() ? (wrap ? 0 : current) : current + page());
    else show(current <= 0 ? (wrap ? count() - 1 : 0) : current - page());
  };

  /* ---------------------------------- autoplay --------------------------- */

  let timer: ReturnType<typeof setTimeout> | undefined;
  let paused = false;
  let hovered = false;
  let focused = false;
  const autoplay = props.autoplay > 0 && !reduced();

  const schedule = () => {
    clearTimeout(timer);
    timer = undefined;
    if (autoplay && !paused && !hovered && !focused && !document.hidden) {
      timer = setTimeout(() => {
        step(true, true);
        schedule();
      }, props.autoplay * 1000);
    }
    /* A rotating region is not announced; a still one is. */
    track.setAttribute('aria-live', timer ? 'off' : 'polite');
  };

  const setPaused = (value: boolean) => {
    paused = value;
    if (play) {
      play.setAttribute('aria-label', value ? props.labels.play : props.labels.pause);
      const [pauseIcon, playIcon] = Array.from(play.children);
      pauseIcon?.toggleAttribute('hidden', value);
      playIcon?.toggleAttribute('hidden', !value);
    }
    schedule();
  };

  /** A visitor's own move stops the rotation for good (until Play). */
  const manual = (fn: () => void) => {
    fn();
    if (autoplay && !paused) setPaused(true);
  };

  /* ----------------------------------- events ---------------------------- */

  if (prev) on(prev, 'click', () => manual(() => step(false)));
  if (next) on(next, 'click', () => manual(() => step(true)));
  dots.forEach((dot, index) => on(dot, 'click', () => manual(() => show(index))));

  on<KeyboardEvent>(root, 'keydown', (event) => {
    const target = event.target as HTMLElement;
    /* Not inside a field, nor the lightbox the slides may open. */
    if (target.closest('input, textarea, select, [contenteditable], dialog')) return;
    const key = event.key;
    if (key === 'Home' || key === 'End') manual(() => show(key === 'Home' ? 0 : count() - 1));
    else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      /* The visual direction: in RTL, → goes back. */
      manual(() => step((key === 'ArrowRight') !== rtl()));
    } else return;
    event.preventDefault();
  });

  if (!fade) {
    /* The slide in view, by the track's own scrolling (swipe, wheel, snap). */
    if (typeof IntersectionObserver === 'function') {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const index = slides().indexOf(entry.target as HTMLElement);
            if (entry.intersectionRatio >= 0.6) visible.add(index);
            else visible.delete(index);
          }
          const seen = [...visible].filter((index) => index >= 0).sort((a, b) => a - b);
          current =
            (props.align === 'center' ? seen[Math.floor(seen.length / 2)] : seen[0]) ?? current;
          refresh();
        },
        { root: track, threshold: 0.6 }
      );
      const watch = () => {
        observer.disconnect();
        visible.clear();
        slides().forEach((slide) => observer.observe(slide));
      };
      watch();
      /* A live list may redraw its cards. */
      const mutations = new MutationObserver(watch);
      mutations.observe(track, { childList: true });
      cleanups.push(() => {
        observer.disconnect();
        mutations.disconnect();
      });
    }

    /* A mouse drags the track; a drag past 6px is not a click on the slide. */
    let lastX: number | null = null;
    let moved = 0;
    on<PointerEvent>(track, 'pointerdown', (event) => {
      if (autoplay && !paused) setPaused(true);
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      lastX = event.clientX;
      moved = 0;
    });
    on<PointerEvent>(track, 'pointermove', (event) => {
      if (lastX === null) return;
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      moved += Math.abs(dx);
      if (moved > 6 && !track.hasAttribute('data-hl-dragging')) {
        track.setAttribute('data-hl-dragging', '');
        track.setPointerCapture?.(event.pointerId);
      }
      if (moved > 6) track.scrollBy?.({ left: -dx });
    });
    const release = (event: PointerEvent) => {
      if (lastX === null) return;
      lastX = null;
      if (!track.hasAttribute('data-hl-dragging')) return;
      track.removeAttribute('data-hl-dragging');
      track.releasePointerCapture?.(event.pointerId);
      const swallow = (click: Event) => {
        click.preventDefault();
        click.stopPropagation();
      };
      track.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => track.removeEventListener('click', swallow, { capture: true }), 0);
    };
    on(track, 'pointerup', release);
    on(track, 'pointercancel', release);
    on(track, 'dragstart', (event) => event.preventDefault());
    on(track, 'wheel', () => autoplay && !paused && setPaused(true), { passive: true });
  }

  if (autoplay) {
    play?.removeAttribute('hidden');
    if (play) {
      on(play, 'click', () => {
        /* Play means now, even with the pointer or the focus on the button. */
        hovered = false;
        focused = false;
        setPaused(!paused);
      });
    }
    on(root, 'mouseenter', () => {
      hovered = true;
      schedule();
    });
    on(root, 'mouseleave', () => {
      hovered = false;
      schedule();
    });
    on<FocusEvent>(root, 'focusin', (event) => {
      focused = event.target !== play;
      schedule();
    });
    on<FocusEvent>(root, 'focusout', (event) => {
      if (!root.contains(event.relatedTarget as Node | null)) focused = false;
      schedule();
    });
    on(document, 'visibilitychange', schedule);
    schedule();
  }

  root.setAttribute('data-hl-ready', '');
  refresh();
  return () => {
    clearTimeout(timer);
    for (const cleanup of cleanups) cleanup();
  };
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * The `carousel` island: an enhancer, not a renderer. It draws one
 * hidden span — so the server HTML and its first render are the same — finds
 * its block from there (never by id: an instance may repeat a node id) and
 * arms the slides the server already drew.
 */
export function CarouselClient(props: CarouselClientProps): ReactElement {
  const ref = useRef<HTMLSpanElement>(null);
  const { mode, autoplay, loop, align, inert, labels } = props;
  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>('[data-hl-block]');
    if (!root) return undefined;
    return wireCarousel(root, { mode, autoplay, loop, align, inert, labels });
    /* Labels are plain strings from the server: their identity never changes. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, autoplay, loop, align, inert, labels.pause, labels.play]);
  return <span hidden ref={ref} />;
}
