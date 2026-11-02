/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CSSProperties, ReactElement } from 'react';
import type { ResolvedMedia } from '../../contracts';
import type { AlignValue } from '../style-props';
import type { BlockProps } from '../types';
import type { HeroProps } from './schema';
import { heroDefaults } from './defaults';

import { Island } from '../../render/island';
import { renderRichText } from '../../richtext';
import { stateMessages } from '../../site/messages';
import { CarouselDots, CarouselPlayButton } from '../carousel/Component';
import { MEDIA_SIZES_ATTR } from '../media';
import {
  blockParts,
  EYEBROW_CLASSES,
  FloatingLayer,
  literal,
  literalMedia,
  MediaFigure,
  MediaImg,
  SiteButton,
} from '../shared';
import { aspectClasses, cx, gapClasses, mergeClasses } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/*
 * Plain Tailwind: what a developer reads here is what renders.
 * A designer's `style` / `elements` entry replaces the default for the same
 * property (`blockParts`); the gap and image ratio are the block's own
 * responsive props. The padding is the theme's density (`.hl-blk`) until a
 * style sets one.
 */
const ALIGN: Record<AlignValue, { copy: string; description: string; actions: string }> = {
  start: { copy: '', description: '', actions: '' },
  center: { copy: 'text-center', description: 'mx-auto', actions: 'justify-center' },
  end: { copy: 'text-end', description: 'ms-auto', actions: 'justify-end' },
};

/** A stored responsive prop's classes, or the default's when it maps to none. */
function orDefault(classes: string[], fallback: string[]): string[] {
  return classes.length > 0 ? classes : fallback;
}

/** Seconds between a slideshow's images when `autoplay` is absent. */
const SLIDER_AUTOPLAY = 6;

/**
 * The slideshow's figure: every image stacked in one box, the first
 * active; `site.css`'s `.hl-fade` cross-fades whichever the `carousel`
 * island marks active. Without a script — and on the canvas — the first
 * image is the hero's image, as before, with a « 1 / n » badge while editing.
 */
function SlideStack({
  images,
  className,
  style,
  sizes,
  badge,
  veil = false,
  field,
}: {
  images: ResolvedMedia[];
  className: string;
  style?: CSSProperties;
  sizes: string;
  badge: boolean;
  /** Text sits over the images (overlay): a veil from the bottom keeps it legible. */
  veil?: boolean;
  field?: { 'data-hl-field'?: string };
}): ReactElement {
  return (
    <div
      className={mergeClasses(
        /* `mergeClasses` has no position group: `relative` only when the
           caller does not place the stack itself. */
        cx(
          !/(^|\s)absolute(\s|$)/.test(className) && 'relative',
          'overflow-hidden rounded-site bg-site-media-fill'
        ),
        ['hl-fade', ...className.split(' ').filter(Boolean)]
      ).join(' ')}
      style={style}
      data-hl-c-track=""
      {...field}
    >
      {images.map((media, index) => (
        <div
          key={`${media.url}-${index}`}
          data-hl-c-slide=""
          data-hl-active={index === 0 || undefined}
        >
          {/* Only the first is fetched with priority; the rest load lazily. */}
          <MediaImg
            className="size-full object-cover"
            media={media}
            sizes={sizes}
            priority={index === 0}
          />
        </div>
      ))}
      {veil ? (
        <span
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-site-scrim/75 to-site-scrim/10"
          aria-hidden="true"
        />
      ) : null}
      {badge ? (
        <span className="absolute end-3 top-3 z-10 rounded-site-pill bg-site-ink/60 px-2 py-0.5 text-site-xs text-site-on-ink tabular-nums">
          1 / {images.length}
        </span>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function HeroBlock(props: BlockProps<HeroProps>): ReactElement {
  const layout = props.layout ?? 'split-end';
  const overlay = layout === 'overlay';
  const { root, context, el, item } = blockParts(
    props,
    'hero',
    cx(
      'isolate',
      overlay &&
        'relative overflow-hidden text-site-on-ink [--site-ink:var(--site-on-ink)] [--site-ink-soft:var(--site-on-ink-muted)]'
    )
  );
  const eyebrow = literal(props.eyebrow, '');
  const title = literal(props.title, heroDefaults.title as string);
  const description = literal(props.description, null);
  const image = literalMedia(props.image);
  /* The slideshow: `image`, then its `slides` — two images or more. */
  const slides: unknown[] = Array.isArray(props.slides) ? props.slides : [];
  const images = [
    image,
    /* An item's `media`; a bare media value is read too (a hand-written prop). */
    ...slides.map((slide) => literalMedia((slide as { media?: unknown })?.media ?? slide)),
  ].filter((media): media is ResolvedMedia => media !== null);
  const slider = images.length > 1;
  const autoplay =
    typeof props.autoplay === 'number' && props.autoplay >= 0 ? props.autoplay : SLIDER_AUTOPLAY;
  const canvas = context.mode === 'canvas';
  const m = stateMessages(context.locale).carousel;
  const align = ALIGN[props.align] ?? ALIGN.start;
  const figure = el(
    'image',
    orDefault(aspectClasses(props.mediaRatio), aspectClasses(heroDefaults.mediaRatio)).join(' ')
  );

  return (
    <section {...root}>
      {overlay && slider ? (
        <SlideStack
          images={images}
          className={cx(
            'absolute inset-0 -z-10 rounded-none',
            props.mediaFit === 'contain' && '[&_img]:object-contain'
          )}
          sizes={MEDIA_SIZES_ATTR.full}
          badge={context.mode !== 'static'}
          veil
          field={{ 'data-hl-field': figure['data-hl-field'] }}
        />
      ) : overlay ? (
        <>
          <MediaFigure
            className={cx(
              'absolute inset-0 -z-10 rounded-none',
              props.mediaFit === 'contain' && '[&_img]:object-contain'
            )}
            media={image}
            sizes={MEDIA_SIZES_ATTR.full}
            priority
            field={{ 'data-hl-field': figure['data-hl-field'] }}
          />
          {/* The same bottom veil as the slideshow: the copy sits on the photo. */}
          <span
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-site-scrim/75 to-site-scrim/10"
            aria-hidden="true"
          />
        </>
      ) : null}
      <div
        className={cx(
          'relative mx-auto grid w-full max-w-site-content items-center',
          layout === 'split-end' && 'md:grid-cols-[1.1fr_0.9fr]',
          layout === 'split-start' && 'md:grid-cols-[0.9fr_1.1fr]',
          /* 70 % of the viewport, read through `--site-viewport-h`: the Design
             canvas pins it to the breakpoint's height — its frame is as tall as
             the page, so a bare `vh` would grow with the frame. */
          overlay && 'min-h-[calc(var(--site-viewport-h,100vh)*0.7)] items-end',
          orDefault(gapClasses(props.gap), gapClasses(heroDefaults.gap))
        )}
      >
        <div
          className={cx(
            align.copy,
            layout === 'split-start' && 'md:order-2',
            overlay && 'max-w-2xl'
          )}
        >
          {eyebrow ? <p {...el('eyebrow', EYEBROW_CLASSES)}>{eyebrow}</p> : null}
          <h1
            {...el(
              'title',
              'mb-4 font-heading text-site-xl leading-none font-normal tracking-tight text-pretty md:text-5xl rtl:tracking-normal'
            )}
          >
            {title}
          </h1>
          <div
            {...el(
              'description',
              cx(
                'hl-rich mb-6 max-w-sm text-site-sm leading-relaxed text-site-ink-soft',
                align.description
              )
            )}
          >
            {renderRichText(description)}
          </div>
          {props.buttons.length > 0 ? (
            <div {...el('buttons', cx('flex flex-wrap gap-2.5', align.actions))}>
              {/* `buttons` styles the row; each button carries its own style. */}
              {props.buttons.map((button, index) => {
                const { 'data-hl-field': field, ...own } = item('buttons', index, button);
                return (
                  <SiteButton
                    key={`${button.href}-${index}`}
                    label={literal(button.label, '')}
                    href={button.href}
                    variant={button.variant}
                    className={own.className || undefined}
                    style={own.style}
                    field={field ? { 'data-hl-field': field } : undefined}
                  />
                );
              })}
            </div>
          ) : null}
          {slider ? (
            <div className={cx('mt-6 flex items-center gap-3', align.actions)}>
              <CarouselDots count={images.length} goTo={m.goTo} onInk={overlay} />
              {autoplay > 0 ? (
                <CarouselPlayButton label={m.pause} shown={false} onInk={overlay} />
              ) : null}
            </div>
          ) : null}
        </div>
        {overlay ? null : slider ? (
          <SlideStack
            images={images}
            className={cx(
              figure.className,
              layout === 'split-start' && 'md:order-1',
              props.mediaFit === 'contain' && '[&_img]:object-contain'
            )}
            style={figure.style}
            sizes={MEDIA_SIZES_ATTR.half}
            badge={context.mode !== 'static'}
            field={{ 'data-hl-field': figure['data-hl-field'] }}
          />
        ) : (
          <MediaFigure
            className={cx(
              figure.className,
              layout === 'split-start' && 'md:order-1',
              props.mediaFit === 'contain' && '[&_img]:object-contain'
            )}
            style={figure.style}
            media={image}
            sizes={MEDIA_SIZES_ATTR.half}
            priority
            placeholder="media / hero.jpg"
            field={{ 'data-hl-field': figure['data-hl-field'] }}
          />
        )}
        {/* Over the content box, not the full-bleed section: a free element
            keeps its place against the copy and image at every width. */}
        <FloatingLayer slot={props.floating} />
      </div>
      {slider ? (
        <Island
          name="carousel"
          markers={context.islands}
          props={{
            mode: 'fade',
            autoplay,
            loop: true,
            align: 'start',
            labels: { pause: m.pause, play: m.play },
            inert: canvas,
          }}
        />
      ) : null}
    </section>
  );
}
