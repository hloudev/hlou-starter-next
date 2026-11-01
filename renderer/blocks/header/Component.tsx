/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { CSSProperties, ReactElement, ReactNode } from 'react';
import type { ResolvedMedia } from '../../contracts';
import type { BlockProps, SiteRenderContext } from '../types';
import type { HeaderProps, NavChild, NavLink } from './schema';
import { headerDefaults } from './defaults';
import { NAV_CHILDREN_MAX } from './schema';

import { Island } from '../../render/island';
import { ariaCurrent, prefixHref } from '../../resolve/href';
import { stateMessages } from '../../site/messages';
import { MEDIA_SIZES_ATTR } from '../media';
import {
  blockParts,
  fieldAttr,
  Icon,
  literal,
  literalMedia,
  MediaImg,
  SiteButton,
} from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

type MenuStyle = NonNullable<HeaderProps['menuStyle']>;

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/* The drawer's breakpoint: the bar's links from it up, the burger below it.
   Literal, so Tailwind finds them. */
const BAR_LINKS: Record<NonNullable<HeaderProps['menuBreakpoint']>, string> = {
  md: 'max-md:hidden',
  lg: 'max-lg:hidden',
};
const BAR_BURGER: Record<NonNullable<HeaderProps['menuBreakpoint']>, string> = {
  md: 'md:hidden',
  lg: 'lg:hidden',
};

const ROUND =
  'inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-site-pill border-0 bg-transparent p-0 text-site-ink';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/** A dropdown's children: labelled entries only, at most eight, `#` for a missing href. */
function asChildren(value: unknown): NavChild[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const children = value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const child = item as Partial<NavChild>;
    if (typeof child.label !== 'string' || !child.label.trim()) return [];
    return [{ label: child.label, href: typeof child.href === 'string' ? child.href : '#' }];
  });
  return children.length > 0 ? children.slice(0, NAV_CHILDREN_MAX) : undefined;
}

/**
 * The link list, literal or resolved from a navigation slot — both are arrays
 * (`contentToLiteral`). An entry with no label is dropped rather than drawn as
 * an empty `<a>`: a half-typed row in the Content editor is not a link yet.
 * Its `children` (M40-11) go through the same checks.
 */
function asLinks(value: unknown): NavLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const link = item as Partial<NavLink>;
    if (typeof link.label !== 'string' || !link.label.trim()) return [];
    const children = asChildren(link.children);
    return [
      {
        label: link.label,
        href: typeof link.href === 'string' ? link.href : '#',
        ...(children ? { children } : {}),
      },
    ];
  });
}

function menuStyleOf(value: unknown): MenuStyle {
  return value === 'drawer' || value === 'fullscreen' ? value : 'inline';
}

/** The wordmark or the logo image, as the bar draws it (and the drawer's head). */
function Logo({
  logo,
  media,
  height,
  context,
}: {
  logo: string;
  media: ResolvedMedia | null;
  height: number;
  context: SiteRenderContext;
}): ReactElement | string {
  if (!media) return logo;
  return (
    <MediaImg
      field={fieldAttr(context, 'logoMedia')}
      media={media}
      alt={media.alt || logo}
      style={{ height }}
      className="w-auto object-contain"
      sizes={MEDIA_SIZES_ATTR.logo}
      eager
    />
  );
}

/**
 * One bar link with a dropdown (M40-11): the link (or, with no href, a
 * button that only opens it), a 28 px caret button — its negative margin
 * keeps the row as tall as its neighbours — and the children. CSS shows
 * the list on hover and on focus within, so mouse and Tab work without a
 * script; the menu island adds the caret toggle (touch), ↓ and Esc.
 */
/** A link's `aria-current` on this page (`ariaCurrent`), bound to the render. */
type CurrentOf = (href: string | undefined) => 'page' | 'true' | undefined;

function DropdownItem({
  link,
  index,
  last,
  id,
  submenu,
  className,
  style,
  field,
  currentOf,
}: {
  link: NavLink;
  index: number;
  last: boolean;
  id: string;
  submenu: string;
  className: string;
  style?: CSSProperties;
  field?: string;
  currentOf: CurrentOf;
}): ReactElement {
  const listId = `${id}-sub-${index + 1}`;
  const caret = <Icon icon={{ name: 'caret-down' }} className="size-3.5" />;
  return (
    <li
      className={cx('hl-menu__item relative flex items-center gap-0.5', className)}
      style={style}
      data-hl-field={field}
    >
      {link.href ? (
        <>
          <a href={link.href} aria-current={currentOf(link.href)}>
            {link.label}
          </a>
          <button
            type="button"
            className="hl-menu__caret -my-1.5 inline-grid size-7 cursor-pointer place-items-center rounded-site border-0 bg-transparent p-0 text-site-ink-soft"
            aria-expanded="false"
            aria-controls={listId}
            aria-label={submenu.replace('{label}', link.label)}
          >
            {caret}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="hl-menu__caret inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-[inherit] text-[inherit]"
          aria-expanded="false"
          aria-controls={listId}
        >
          {link.label}
          {caret}
        </button>
      )}
      <ul
        id={listId}
        className={cx(
          'hl-menu__sub absolute top-[calc(100%+14px)] z-30 m-0 min-w-[220px] list-none rounded-site bg-site-card p-2 shadow-site-pop',
          last ? 'end-[-14px]' : 'start-[-14px]'
        )}
      >
        {link.children?.map((child, at) => (
          <li key={`${child.href}-${at}`}>
            <a
              href={child.href}
              aria-current={currentOf(child.href)}
              className="block rounded-site px-3 py-2.5 text-site-sm text-site-ink hover:bg-site-well hover:no-underline"
            >
              {child.label}
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
}

/** A link with its children as a nested, indented list: the drawer and the full-screen menu. */
function StackedLinks({
  links,
  linkClass,
  childList,
  childClass,
  rise,
  currentOf,
}: {
  links: NavLink[];
  linkClass: string;
  childList: string;
  childClass: string;
  /** The full-screen menu: each item rises in turn (`--n`). */
  rise?: boolean;
  currentOf: CurrentOf;
}): ReactElement {
  return (
    <ul className="m-0 grid list-none p-0">
      {links.map((link, index) => (
        <li
          key={`${link.href}-${index}`}
          className={rise ? 'hl-menu__rise' : undefined}
          style={rise ? ({ '--n': index } as CSSProperties) : undefined}
        >
          {link.href ? (
            <a href={link.href} aria-current={currentOf(link.href)} className={linkClass}>
              {link.label}
            </a>
          ) : (
            <span className={linkClass}>{link.label}</span>
          )}
          {link.children ? (
            <ul className={childList}>
              {link.children.map((child, at) => (
                <li key={`${child.href}-${at}`}>
                  <a href={child.href} aria-current={currentOf(child.href)} className={childClass}>
                    {child.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * The site header. `menuStyle` (M40-11) picks how the links show: in the bar
 * (`inline`, a stored header's look), in a sheet from the inline end below a
 * breakpoint (`drawer`), or in a full-screen menu behind a burger
 * (`fullscreen`). Both panels are native popovers — the browser opens,
 * closes, layers and dismisses them with no script; the menu island only adds
 * focus and the dropdowns' keys. `overlay` lays the bar transparent over the
 * block below it, in on-ink colours.
 */
export function HeaderBlock(props: BlockProps<HeaderProps>): ReactElement {
  const menuStyle = menuStyleOf(props.menuStyle);
  const overlay = props.overlay === true;
  const { root, context, el, item } = blockParts(
    props,
    'header',
    overlay
      ? cx(
          'hl-header--overlay inset-x-0 top-0 z-20 py-4.25 transition-[background-color,border-color] duration-200 motion-reduce:transition-none data-hl-scrolled:border-b data-hl-scrolled:border-site-hairline data-hl-scrolled:bg-site-paper',
          props.sticky ? 'fixed' : 'absolute'
        )
      : cx(
          'border-b border-site-hairline bg-site-paper py-4.25',
          props.sticky && 'sticky top-0 z-10'
        )
  );
  const logo = literal(props.logo, headerDefaults.logo as string);
  const logoMedia = literalMedia(props.logoMedia);
  const logoHeight = typeof props.logoHeight === 'number' ? props.logoHeight : 28;
  const links = asLinks(literal(props.links, headerDefaults.links as NavLink[]));
  const ctaLabel = literal(props.ctaLabel, '');
  const cta = el('ctaLabel', 'px-3.25 py-1.75 text-site-sm');
  const canvas = context.mode === 'canvas';
  const messages = stateMessages(context.locale).menu;
  const menuId = `hl-menu-${props.id}`;
  const breakpoint = props.menuBreakpoint === 'md' ? 'md' : 'lg';
  const dropdowns = links.some((link) => link.children);
  /* Only what needs a script draws the island: a stored inline header stays as it was. */
  const island = menuStyle !== 'inline' || dropdowns || (overlay && props.sticky);
  /* Home under the render's base path, as the resolved links are: the preview
     (`/p/<slug>/fr?build=…`) and the in-app live site (`/s/<domain>/fr`)
     would otherwise land on Hlou's own `/`. */
  const home = prefixHref('/', context.basePath ?? '');
  const currentOf: CurrentOf = (href) => (href ? ariaCurrent(href, context) : undefined);
  const logoLink = (className?: string) => (
    <a
      href={home}
      {...el(
        'logo',
        cx(
          'inline-flex items-center',
          !logoMedia && 'font-heading text-site-md tracking-[-0.01em] rtl:tracking-normal',
          className
        )
      )}
    >
      <Logo logo={logo} media={logoMedia} height={logoHeight} context={context} />
    </a>
  );
  const burger = el('burger', cx(ROUND, menuStyle === 'drawer' && BAR_BURGER[breakpoint]));

  const barLinks = (className: string) => (
    <nav aria-label={logo} className={className}>
      <ul className="my-0 flex list-none flex-wrap gap-4.25 p-0" {...fieldAttr(context, 'links')}>
        {links.map((link, index) => {
          /* A plain link spreads its `item(…)` inline: Design › Code reveals
             `links[n]` at the element that names it. */
          if (!link.children) {
            return (
              <li
                key={`${link.href}-${index}`}
                {...item('links', index, link, 'text-site-sm text-site-ink-soft', 'links')}
              >
                <a href={link.href} aria-current={currentOf(link.href)}>
                  {link.label}
                </a>
              </li>
            );
          }
          const box = item('links', index, link, 'text-site-sm text-site-ink-soft', 'links');
          return (
            <DropdownItem
              key={`${link.href}-${index}`}
              link={link}
              index={index}
              last={index === links.length - 1 && index > 0}
              id={menuId}
              submenu={messages.submenu}
              className={box.className}
              style={box.style}
              field={box['data-hl-field']}
              currentOf={currentOf}
            />
          );
        })}
      </ul>
    </nav>
  );

  const ctaButton = (className?: string) =>
    ctaLabel ? (
      <SiteButton
        className={cx(cta.className, className)}
        style={cta.style}
        label={ctaLabel}
        href={props.ctaHref}
        field={{ 'data-hl-field': cta['data-hl-field'] }}
      />
    ) : null;

  const burgerButton =
    menuStyle === 'inline' ? null : (
      <button
        type="button"
        {...burger}
        aria-label={messages.open}
        {...(canvas ? { tabIndex: -1 } : { popoverTarget: menuId })}
      >
        <Icon icon={{ name: 'list' }} className="size-5.5" />
      </button>
    );

  let bar: ReactNode;
  if (menuStyle === 'inline') {
    bar = (
      <div className="mx-auto flex w-full max-w-site-content flex-wrap items-center gap-5">
        {logoLink()}
        {barLinks('ms-auto max-[390px]:ms-0 max-[390px]:w-full')}
        {ctaButton()}
      </div>
    );
  } else if (menuStyle === 'drawer') {
    bar = (
      <div className="hl-header__bar mx-auto flex w-full max-w-site-content items-center gap-5 max-md:gap-2">
        {logoLink('me-auto')}
        {barLinks(BAR_LINKS[breakpoint])}
        {ctaButton('max-md:hidden')}
        {burgerButton}
      </div>
    );
  } else {
    bar = (
      <div className="hl-header__bar mx-auto flex w-full max-w-site-content items-center gap-5 max-md:gap-2">
        {burgerButton}
        {logoLink('me-auto')}
        {ctaButton('max-md:hidden')}
      </div>
    );
  }

  const panel = menuStyle === 'inline' ? null : menuPanel();

  return (
    <header {...root}>
      {overlay ? <div className="hl-header__ink">{bar}</div> : bar}
      {panel}
      {island ? <Island name="menu" markers={context.islands} props={{ inert: canvas }} /> : null}
    </header>
  );

  /** The drawer or the full-screen menu: a popover, or inline in a component frame. */
  function menuPanel(): ReactElement | null {
    const preview = canvas && context.previewOverlays === true;
    if (canvas && !preview) return null;
    const close = (
      <button
        type="button"
        className={cx(ROUND, 'border border-site-hairline-strong bg-site-card')}
        aria-label={messages.close}
        {...(canvas ? { tabIndex: -1 } : { popoverTarget: menuId, popoverTargetAction: 'hide' })}
      >
        <Icon icon={{ name: 'x' }} className="size-4.5" />
      </button>
    );
    const popover = preview
      ? { 'data-hl-menu-preview': '' }
      : { id: menuId, popover: 'auto' as const };

    if (menuStyle === 'drawer') {
      return (
        <div
          {...popover}
          role="dialog"
          aria-label={logo}
          {...el(
            'menu',
            cx(
              'hl-menu hl-menu--drawer bg-site-paper p-0 text-site-ink shadow-site-pop',
              preview
                ? 'mt-4 ms-auto grid w-[min(22rem,88vw)] border border-dashed border-site-hairline-strong'
                : 'border-0'
            )
          )}
        >
          <div className="flex items-center justify-between gap-4 border-b border-site-hairline py-3.5 ps-5 pe-4">
            {logoLink()}
            {close}
          </div>
          <nav aria-label={logo} className="overflow-auto px-2 py-3">
            <StackedLinks
              links={links}
              linkClass="flex min-h-12 items-center rounded-site px-3 text-site-md text-site-ink hover:no-underline hover:bg-site-well"
              childList="m-0 ms-3 mb-1.5 list-none border-s border-site-hairline-strong p-0 ps-4"
              childClass="flex min-h-10 items-center rounded-site px-3 text-site-sm text-site-ink-soft hover:no-underline hover:bg-site-well"
              currentOf={currentOf}
            />
          </nav>
          {ctaLabel ? (
            <div className="border-t border-site-hairline px-5 pt-4 pb-6">
              {ctaButton('w-full justify-center')}
            </div>
          ) : null}
        </div>
      );
    }

    const media = literalMedia(props.menuMedia);
    return (
      <div
        {...popover}
        role="dialog"
        aria-label={logo}
        {...el(
          'menu',
          cx(
            'hl-menu hl-menu--fullscreen bg-site-paper p-0 text-site-ink md:grid-cols-[2fr_3fr]',
            preview
              ? 'relative mt-4 grid min-h-[560px] border border-dashed border-site-hairline-strong'
              : 'border-0'
          )
        )}
      >
        {media ? (
          <figure className="hl-menu__media m-0 overflow-hidden bg-site-media-fill max-md:absolute max-md:inset-0 max-md:opacity-[0.12]">
            <MediaImg
              field={fieldAttr(context, 'menuMedia')}
              media={media}
              alt=""
              className="size-full object-cover"
              sizes={MEDIA_SIZES_ATTR.half}
            />
          </figure>
        ) : null}
        <div
          className={cx(
            'relative grid grid-rows-[auto_1fr] px-5 pt-4 pb-8 md:ps-18 md:pe-10 md:pt-7 md:pb-10',
            !media && 'md:col-span-2'
          )}
        >
          <div className="flex justify-end">{close}</div>
          <nav aria-label={logo} className="self-center">
            <StackedLinks
              rise
              links={links}
              linkClass="inline-block py-0.5 font-heading text-[calc(var(--site-type-xl)*0.55)] leading-[1.15] tracking-[0.01em] text-site-ink uppercase hover:text-site-accent hover:no-underline md:text-[calc(var(--site-type-xl)*0.82)] rtl:tracking-normal"
              childList="m-0 mt-1 mb-3 grid list-none gap-1 p-0"
              childClass="text-site-sm text-site-ink-soft hover:text-site-accent hover:no-underline"
              currentOf={currentOf}
            />
          </nav>
        </div>
      </div>
    );
  }
}
