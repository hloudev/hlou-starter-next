/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement, ReactNode } from 'react';
import type { ResolvedMedia } from '../../contracts';
import type { SiteRenderContext } from '../types';
import type { LightboxClientProps, LightboxItem } from './LightboxClient';

import { Island } from '../../render/island';
import { fillMessage, stateMessages } from '../../site/messages';
import { mediaImgAttrs, pickServedRendition } from '../media';
import { Icon } from '../shared';

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** The images one lightbox carries in its props; the links past it open the file. */
export const LIGHTBOX_MAX_ITEMS = 60;

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** Where an enlarge link goes without a script: the `xl` rung, else the original. */
export function lightboxHref(media: ResolvedMedia): string {
  return pickServedRendition(media.renditions, 'xl')?.url ?? media.url;
}

/** One image for the viewer: the browser picks the rung for the viewport (`sizes: 100vw`). */
export function lightboxItem(media: ResolvedMedia, caption: string): LightboxItem {
  const { src, srcSet, sizes, width, height, reducedMotionSrc } = mediaImgAttrs(media, {
    sizes: '100vw',
  });
  return {
    src,
    ...(srcSet ? { srcSet, sizes } : {}),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(reducedMotionSrc ? { reducedMotionSrc } : {}),
    alt: media.alt ?? '',
    caption,
  };
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

/**
 * An image that opens the lightbox (M40-09): a link to the large file, so a
 * visitor without a script — or a ⌘-click — still gets the image itself.
 * The zoom chip shows on hover and focus.
 */
export function LightboxLink({
  media,
  index,
  label,
  className,
  children,
}: {
  media: ResolvedMedia;
  /** Its place in the lightbox's `items`. */
  index: number;
  /** « Agrandir l’image : {alt} ». */
  label: string;
  className?: string;
  children: ReactNode;
}): ReactElement {
  return (
    <a
      href={lightboxHref(media)}
      data-hl-lightbox={index}
      aria-label={fillMessage(label, { alt: media.alt ?? '' })}
      className={['group/lb relative block cursor-zoom-in no-underline', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
      <span
        className="pointer-events-none absolute end-3 top-3 z-10 grid size-9 place-items-center rounded-site-pill bg-site-card text-site-ink opacity-0 transition-opacity duration-150 group-hover/lb:opacity-100 group-focus-visible/lb:opacity-100 motion-reduce:transition-none"
        aria-hidden="true"
      >
        <Icon icon="magnifying-glass-plus" className="size-4.25" />
      </span>
    </a>
  );
}

/** The viewer itself: the `lightbox` island over `items` (at most 60), inert on the canvas. */
export function LightboxIsland({
  items,
  context,
}: {
  items: LightboxItem[];
  context: SiteRenderContext;
}): ReactElement {
  const m = stateMessages(context.locale);
  const props: LightboxClientProps = {
    items: items.slice(0, LIGHTBOX_MAX_ITEMS),
    labels: {
      dialog: m.lightbox.dialog,
      close: m.close,
      prev: m.lightbox.prev,
      next: m.lightbox.next,
      of: m.carousel.of,
    },
    inert: context.mode === 'canvas',
  };
  return <Island name="lightbox" markers={context.islands} props={props} />;
}
