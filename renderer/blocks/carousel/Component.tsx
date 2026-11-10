/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CSSProperties, ReactElement, ReactNode } from 'react';
import type { ResolvedMedia } from '../../contracts';
import type { LightboxItem } from '../gallery/LightboxClient';
import type { BlockProps } from '../types';
import type { CarouselProps } from './schema';
import { carouselDefaults } from './defaults';

import { Island } from '../../render/island';
import { fillMessage, stateMessages } from '../../site/messages';
import { LightboxIsland, lightboxItem, LightboxLink } from '../gallery/lightbox';
import { columnsSizes, widestCount } from '../media';
import {
  BindBadge,
  blockParts,
  collectionOf,
  EYEBROW_CLASSES,
  fieldAttr,
  Icon,
  isLeadBlock,
  literal,
  literalMedia,
  MediaFigure,
  styleVars,
  toListingItems,
} from '../shared';
import { cx, mergeClasses, SPACE_STEPS } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const RATIO: Record<CarouselProps['ratio'], string> = {
  square: 'aspect-square',
  portrait: 'aspect-4/5',
  landscape: 'aspect-[4/3]',
  wide: 'aspect-[21/9]',
};

/** A round 44px control on the card: arrows and the pause button (D0 « Site widgets »). */
export const CAROUSEL_ICON_BUTTON =
  'inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-site-pill border border-site-hairline-strong bg-site-card text-site-ink aria-disabled:cursor-not-allowed aria-disabled:opacity-40 [&_svg]:size-4.5';

/** The same control over a photo (the hero slider): hairline and glyph in the on-ink colour. */
const ON_INK_BUTTON = 'border-site-on-ink/40 bg-transparent text-site-on-ink';

/** The control's classes: the round button, then the caller's (which win per property). */
function iconButton(onInk: boolean, className: string | undefined): string {
  return mergeClasses(CAROUSEL_ICON_BUTTON, [
    ...(onInk ? ON_INK_BUTTON.split(' ') : []),
    ...(className ? className.split(' ') : []),
  ]).join(' ');
}

const BREAKPOINT_SUFFIX = { base: '', md: '-md', lg: '-lg', xl: '-xl' } as const;

/** With a peek, a phone shows 82 % of one slide and a wider screen 0.6 of the next. */
function perViewWithPeek(count: number, peek: boolean): number {
  if (!peek) return count;
  return count === 1 ? 1.22 : count + 0.6;
}

/**
 * The slides-per-view and gap of each breakpoint, as the custom properties
 * `site.css`'s `.hl-carousel` reads. Stored props are unvalidated: anything
 * but a count 1–4 or a vocabulary step is dropped.
 */
export function carouselVars(perView: unknown, gap: unknown, peek: boolean): CSSProperties {
  const vars: Record<string, string | number | undefined> = {};
  const per = typeof perView === 'object' && perView !== null ? perView : {};
  const gaps = typeof gap === 'object' && gap !== null ? gap : {};
  for (const [bp, suffix] of Object.entries(BREAKPOINT_SUFFIX)) {
    const count = (per as Record<string, unknown>)[bp];
    if (typeof count === 'number' && Number.isInteger(count) && count >= 1 && count <= 4) {
      vars[`--site-carousel-per${suffix}`] = perViewWithPeek(count, peek);
    }
    const step = (gaps as Record<string, unknown>)[bp];
    if (typeof step === 'string' && (SPACE_STEPS as readonly string[]).includes(step)) {
      vars[`--site-carousel-gap${suffix}`] = `calc(${step} * 0.25rem)`;
    }
  }
  return styleVars(vars);
}

/* -------------------------------------------------------------------------- */
/*                                    SLIDES                                  */
/* -------------------------------------------------------------------------- */

/** One slide as the markup draws it: a typed item, or a record through the mapping. */
type SlideView = {
  key: string;
  media: ResolvedMedia | null;
  eyebrow: string;
  title: string;
  text: string;
  price: string;
  href: string;
  ctaLabel: string;
  style?: unknown;
};

function slidesOf(props: BlockProps<CarouselProps>, locale: string): SlideView[] {
  const collection = collectionOf(props.source);
  if (collection) {
    return toListingItems(collection, props.mapping, props.limit, locale).map((item) => ({
      key: item.id,
      media: item.image,
      eyebrow: '',
      title: item.title,
      text: item.meta,
      price: item.price,
      href: item.href ?? '',
      ctaLabel: '',
    }));
  }
  return (Array.isArray(props.items) ? props.items : []).map((item, index) => ({
    key: `item-${index}`,
    media: literalMedia(item.media),
    eyebrow: literal(item.eyebrow, ''),
    title: literal(item.title, ''),
    text: literal(item.text, ''),
    price: '',
    href: typeof item.href === 'string' ? item.href : '',
    ctaLabel: literal(item.ctaLabel, ''),
    style: item.style,
  }));
}

/** A slide's lines: under the image (`card`) or over it (`textOver`). */
function SlideBody({ slide, over }: { slide: SlideView; over: boolean }): ReactElement | null {
  if (!slide.eyebrow && !slide.title && !slide.text && !slide.price && !slide.ctaLabel) {
    return null;
  }
  return (
    <div
      className={cx(
        over
          ? 'pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-site-ink/70 via-site-ink/10 to-transparent p-5 text-site-on-ink [--site-ink-soft:var(--site-on-ink-muted)]'
          : 'pt-3.5'
      )}
    >
      {slide.eyebrow ? (
        <p className={cx(EYEBROW_CLASSES, 'mb-1.5', over && 'text-site-on-ink')}>{slide.eyebrow}</p>
      ) : null}
      {slide.title ? (
        <h3 className="m-0 font-heading text-site-md leading-tight">{slide.title}</h3>
      ) : null}
      {slide.text ? (
        <p className="mt-1 text-site-xs tracking-[0.04em] text-site-ink-soft">{slide.text}</p>
      ) : null}
      {slide.price ? <p className="mt-2 text-site-sm text-site-accent">{slide.price}</p> : null}
      {slide.ctaLabel ? (
        <span className="mt-2.5 inline-flex items-center gap-1.5 text-site-sm underline-offset-4 group-hover/slide:underline">
          {slide.ctaLabel}
          <Icon icon="caret-right" className="size-3.5 rtl:-scale-x-100" />
        </span>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  CONTROLS                                  */
/* -------------------------------------------------------------------------- */

/** Previous / next: drawn on the server, hidden until the island arms them. */
export function CarouselArrow({
  forward,
  label,
  disabled,
  className,
}: {
  forward: boolean;
  label: string;
  disabled: boolean;
  className?: string;
}): ReactElement {
  return (
    <button
      type="button"
      className={iconButton(false, className)}
      aria-label={label}
      aria-disabled={disabled}
      data-hl-c-ctl=""
      {...(forward ? { 'data-hl-c-next': '' } : { 'data-hl-c-prev': '' })}
    >
      {/* Mirrored in RTL: there, « previous » points right. */}
      <Icon icon={forward ? 'caret-right' : 'caret-left'} className="rtl:-scale-x-100" />
    </button>
  );
}

/** The dots: one per slide, the first current. */
export function CarouselDots({
  count,
  goTo,
  onInk = false,
  className,
  field,
  style,
  motion,
}: {
  count: number;
  /** « Aller à la diapositive {n} ». */
  goTo: string;
  onInk?: boolean;
  className?: string;
  field?: { 'data-hl-field'?: string };
  style?: CSSProperties;
  /** The dots' own motion (`Styled['data-hl-motion']`). */
  motion?: string;
}): ReactElement {
  return (
    <div
      className={cx(
        'hl-carousel__dots flex flex-wrap items-center px-1',
        onInk && 'hl-carousel__dots--on-ink',
        className
      )}
      style={style}
      data-hl-c-ctl=""
      {...field}
      {...(motion ? { 'data-hl-motion': motion } : {})}
    >
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          className="hl-carousel__dot"
          aria-label={fillMessage(goTo, { n: index + 1 })}
          aria-current={index === 0}
          data-hl-c-dot=""
        />
      ))}
    </div>
  );
}

/**
 * Pause / play, whenever autoplay runs (WCAG 2.2.2). The island shows it —
 * never under reduced motion, where nothing rotates — and swaps the icons.
 */
export function CarouselPlayButton({
  label,
  shown,
  onInk = false,
  className,
}: {
  label: string;
  /** Drawn visible (the canvas); otherwise the island unhides it. */
  shown: boolean;
  onInk?: boolean;
  className?: string;
}): ReactElement {
  return (
    <button
      type="button"
      className={iconButton(onInk, className)}
      aria-label={label}
      data-hl-c-ctl=""
      data-hl-c-play=""
      hidden={!shown}
    >
      <Icon icon="pause" />
      <span hidden>
        <Icon icon="play" className="rtl:-scale-x-100" />
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export function CarouselBlock(props: BlockProps<CarouselProps>): ReactElement {
  const align = props.align === 'center' ? 'center' : 'start';
  const { root, context, el, item } = blockParts(
    props,
    'carousel',
    cx('hl-carousel', align === 'center' && 'hl-carousel--center')
  );
  const canvas = context.mode === 'canvas';
  const m = stateMessages(context.locale).carousel;
  const title = literal(props.title, carouselDefaults.title as string);
  const slides = slidesOf(props, context.locale);
  const total = slides.length;
  const look = props.look === 'textOver' || props.look === 'image' ? props.look : 'card';
  const ratio = RATIO[props.ratio] ?? RATIO.portrait;
  const arrows = props.arrows === 'sides' || props.arrows === 'below' ? props.arrows : 'none';
  const autoplay = typeof props.autoplay === 'number' && props.autoplay > 0 ? props.autoplay : 0;
  const loop = props.loop === true;
  const sizes = columnsSizes(widestCount(props.perView, 3));
  const lead = isLeadBlock(context, props.id);
  const collection = collectionOf(props.source);
  const sourceKey =
    collection?.collectionKey ??
    (props.source && '$collection' in props.source ? props.source.$collection : null);
  /* A bound collection gives the slides; the canvas says which. */
  const badge = context.mode !== 'static' && sourceKey !== null;
  const rootStyle = { ...root.style, ...carouselVars(props.perView, props.gap, props.peek) };
  /* Unset is `link`; `lightbox` opens the slides' images full screen. */
  const onClick = props.onClick === 'none' || props.onClick === 'lightbox' ? props.onClick : 'link';
  const enlarge = stateMessages(context.locale).lightbox.open;
  const viewer: LightboxItem[] = [];
  const arrowsEl = el('arrows', 'flex gap-2.5');
  const dotsEl = el('dots');

  const arrow = (forward: boolean, className?: string): ReactNode => (
    <CarouselArrow
      forward={forward}
      label={forward ? m.next : m.prev}
      disabled={!forward && !loop}
      className={className}
    />
  );

  return (
    <section
      {...root}
      style={rootStyle}
      aria-roledescription={m.region}
      aria-label={title || m.region}
      /* The canvas draws the controls the island would show (it never runs there). */
      {...(canvas ? { 'data-hl-ready': '' } : {})}
    >
      <div className="mx-auto w-full max-w-site-content">
        {title || badge ? (
          <div className="mb-6.5 flex items-center gap-2.5">
            {title ? <h2 {...el('title', 'font-heading text-site-lg')}>{title}</h2> : null}
            {badge ? <BindBadge>DB {sourceKey}</BindBadge> : null}
          </div>
        ) : null}
        <div className="relative">
          <div
            className="hl-carousel__track"
            data-hl-c-track=""
            tabIndex={canvas ? undefined : 0}
            {...fieldAttr(context, 'items')}
          >
            {slides.map((slide, index) => {
              const own = item(
                'items',
                index,
                slide,
                cx('group/slide relative', look === 'textOver' && 'overflow-hidden rounded-site'),
                'items'
              );
              const figure = (
                <MediaFigure
                  media={slide.media}
                  sizes={sizes}
                  priority={index === 0 && lead}
                  placeholder="media / slide.jpg"
                  className={ratio}
                />
              );
              const media =
                onClick === 'lightbox' && slide.media ? (
                  <LightboxLink
                    media={slide.media}
                    index={viewer.push(lightboxItem(slide.media, slide.title)) - 1}
                    label={enlarge}
                  >
                    {figure}
                  </LightboxLink>
                ) : (
                  figure
                );
              const body =
                look === 'image' ? null : <SlideBody slide={slide} over={look === 'textOver'} />;
              return (
                <div
                  key={slide.key}
                  role="group"
                  aria-roledescription={m.slide}
                  aria-label={fillMessage(m.of, { n: index + 1, total })}
                  className={own.className}
                  style={own.style}
                  data-hl-field={own['data-hl-field']}
                  data-hl-motion={own['data-hl-motion']}
                >
                  {onClick === 'link' && slide.href ? (
                    <a href={slide.href} className="block text-inherit no-underline">
                      {media}
                      {body}
                    </a>
                  ) : (
                    <>
                      {media}
                      {body}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {arrows === 'sides' && total > 1 ? (
            <>
              {arrow(false, 'absolute start-3 top-1/2 z-10 -translate-y-1/2 max-md:hidden')}
              {arrow(true, 'absolute end-3 top-1/2 z-10 -translate-y-1/2 max-md:hidden')}
            </>
          ) : null}
        </div>
        {(props.dots && total > 1) || autoplay > 0 || (arrows === 'below' && total > 1) ? (
          <div className="mt-5.5 flex items-center gap-3">
            {props.dots && total > 1 ? (
              <CarouselDots
                count={total}
                goTo={m.goTo}
                className={cx(dotsEl.className, arrows === 'below' ? 'me-auto' : 'mx-auto')}
                style={dotsEl.style}
                motion={dotsEl['data-hl-motion']}
                field={{ 'data-hl-field': dotsEl['data-hl-field'] }}
              />
            ) : null}
            {autoplay > 0 ? (
              <CarouselPlayButton label={m.pause} shown={canvas} className="max-md:order-first" />
            ) : null}
            {arrows === 'below' && total > 1 ? (
              <div
                className={cx(arrowsEl.className, 'ms-auto max-md:hidden')}
                style={arrowsEl.style}
                data-hl-field={arrowsEl['data-hl-field']}
                data-hl-motion={arrowsEl['data-hl-motion']}
              >
                {arrow(false)}
                {arrow(true)}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {viewer.length > 0 ? <LightboxIsland items={viewer} context={context} /> : null}
      <Island
        name="carousel"
        markers={context.islands}
        props={{
          mode: 'scroll',
          autoplay,
          loop,
          align,
          labels: { pause: m.pause, play: m.play },
          inert: canvas,
        }}
      />
    </section>
  );
}
