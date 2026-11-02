'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import { useEffect, useRef, useState } from 'react';

import type { KeyboardEvent, PointerEvent, ReactElement } from 'react';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** One image the viewer shows: `mediaImgAttrs(media, { sizes: '100vw' })`, computed on the server. */
export type LightboxItem = {
  src: string;
  srcSet?: string;
  /** `100vw` beside a `srcSet`: the browser picks the rung for the viewport × DPR. */
  sizes?: string;
  width?: number;
  height?: number;
  /** A GIF's still frame, for `prefers-reduced-motion`. */
  reducedMotionSrc?: string;
  alt: string;
  caption: string;
};

export type LightboxClientProps = {
  items: LightboxItem[];
  /** `of` holds `{n}` and `{total}`. */
  labels: { dialog: string; close: string; prev: string; next: string; of: string };
  /** The Design canvas: the links are drawn, nothing opens. */
  inert: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/** A round 44px control on the scrim (D0 « Lightbox »). */
const BUTTON =
  'inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-site-pill border border-site-on-scrim/35 bg-transparent text-site-on-scrim [&_svg]:size-4.5 [&_svg]:fill-current';

/* The three glyphs, inlined: the island draws its own markup (Phosphor regular). */
const CARET =
  'M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z';
const X =
  'M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z';

function Glyph({ d, className }: { d: string; className?: string }): ReactElement {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" className={className}>
      <path d={d} />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * The `lightbox` island: a native modal `<dialog>` —
 * the browser traps the focus, makes the page inert and closes on Esc. It
 * draws its own markup, closed, so the server HTML and the first client
 * render are the same, and opens on a plain click on any `[data-hl-lightbox]`
 * link of its block; without a script those links open the image itself.
 */
export function LightboxClient({ items, labels, inert }: LightboxClientProps): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const closer = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const total = items.length;
  const item = index === null ? undefined : items[index];

  /* One delegated listener on the block: a plain click on a link opens. */
  useEffect(() => {
    const box = dialog.current;
    const root = box?.closest<HTMLElement>('[data-hl-block]');
    if (inert || !box || !root) return undefined;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLElement>('[data-hl-lightbox]');
      if (!link || link.closest('[data-hl-block]') !== root || box.contains(link)) return;
      /* ⌘ / ctrl / shift / a middle click still open the file. */
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const at = Number(link.getAttribute('data-hl-lightbox'));
      if (!Number.isInteger(at) || at < 0 || at >= total) return;
      event.preventDefault();
      opener.current = link;
      setIndex(at);
      box.showModal();
      closer.current?.focus();
    };
    const onClose = () => {
      setIndex(null);
      opener.current?.focus();
    };
    root.addEventListener('click', onClick);
    box.addEventListener('close', onClose);
    return () => {
      root.removeEventListener('click', onClick);
      box.removeEventListener('close', onClose);
    };
  }, [inert, total]);

  /* The neighbours, decoded ahead: never the whole list. */
  useEffect(() => {
    if (index === null || total < 2) return;
    for (const at of new Set([(index + total - 1) % total, (index + 1) % total])) {
      const next = items[at];
      if (!next || at === index) continue;
      const image = new Image();
      if (next.sizes) image.sizes = next.sizes;
      if (next.srcSet) image.srcset = next.srcSet;
      image.src = next.src;
      image.decode?.().catch(() => undefined);
    }
  }, [index, items, total]);

  const go = (at: number) => setIndex(((at % total) + total) % total);
  const step = (forward: boolean) => index !== null && go(index + (forward ? 1 : -1));
  const rtl = () => dialog.current?.closest('[dir]')?.getAttribute('dir') === 'rtl';

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    const key = event.key;
    if (key === 'Home') go(0);
    else if (key === 'End') go(total - 1);
    /* The visual direction: in RTL, → goes back. */
    else if (key === 'ArrowRight' || key === 'ArrowLeft') step((key === 'ArrowRight') !== rtl());
    else return;
    event.preventDefault();
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(event.clientY - start.y)) {
      /* Dragging the image away from where the next one comes in. */
      step(dx < 0 !== rtl());
    }
  };

  const close = () => dialog.current?.close();

  return (
    <dialog
      ref={dialog}
      data-hl-lightbox-dialog=""
      aria-label={labels.dialog}
      /* Light dismiss where the browser has it; the veil click covers the rest. */
      closedby="any"
      className="fixed inset-0 m-0 grid h-dvh max-h-none w-dvw max-w-none grid-rows-[auto_minmax(0,1fr)] gap-3 border-0 bg-site-scrim px-6 pt-4.5 pb-7 text-site-on-scrim not-open:hidden backdrop:bg-transparent max-md:px-3 max-md:pt-3 max-md:pb-5"
      onKeyDown={onKeyDown}
      onClick={(event) => {
        /* A click on the veil (not the image, not a control) closes. */
        if ((event.target as Element).hasAttribute('data-hl-lb-veil')) close();
      }}
    >
      <div className="flex items-center justify-between" data-hl-lb-veil="">
        <span className="text-site-xs tracking-[0.08em] tabular-nums" aria-live="polite">
          {index === null
            ? ''
            : labels.of.replace('{n}', String(index + 1)).replace('{total}', String(total))}
        </span>
        <button
          ref={closer}
          type="button"
          className={BUTTON}
          aria-label={labels.close}
          onClick={close}
        >
          <Glyph d={X} />
        </button>
      </div>
      <div
        className="grid min-h-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 max-md:grid-cols-2 max-md:grid-rows-[minmax(0,1fr)_auto] max-md:gap-3"
        data-hl-lb-veil=""
      >
        <button
          type="button"
          className={`${BUTTON} max-md:row-start-2 max-md:justify-self-end`}
          aria-label={labels.prev}
          onClick={() => step(false)}
        >
          <Glyph d={CARET} className="-scale-x-100 rtl:scale-x-100" />
        </button>
        <figure
          className="m-0 grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] justify-items-center gap-3 max-md:col-span-2 max-md:row-start-1"
          data-hl-lb-veil=""
        >
          {item ? (
            <picture className="contents" key={index}>
              {item.reducedMotionSrc ? (
                <source media="(prefers-reduced-motion: reduce)" srcSet={item.reducedMotionSrc} />
              ) : null}
              <img
                className="hl-lightbox__img size-full min-h-0 touch-pan-y object-contain select-none"
                src={item.src}
                srcSet={item.srcSet}
                sizes={item.sizes}
                width={item.width}
                height={item.height}
                alt={item.alt}
                decoding="async"
                draggable={false}
                onPointerDown={(event) => {
                  swipe.current = { x: event.clientX, y: event.clientY };
                }}
                onPointerUp={onPointerUp}
                onPointerCancel={() => {
                  swipe.current = null;
                }}
              />
            </picture>
          ) : null}
          {item?.caption ? (
            <figcaption className="text-site-sm opacity-80">{item.caption}</figcaption>
          ) : null}
        </figure>
        <button
          type="button"
          className={`${BUTTON} max-md:row-start-2 max-md:justify-self-start`}
          aria-label={labels.next}
          onClick={() => step(true)}
        >
          <Glyph d={CARET} className="rtl:-scale-x-100" />
        </button>
      </div>
    </dialog>
  );
}
