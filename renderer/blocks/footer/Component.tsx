/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { FooterProps } from './schema';

import { AttributionBadge, readFooterAttribution } from '../../site/attribution-badge';
import { MEDIA_SIZES_ATTR } from '../media';
import {
  blockParts,
  fieldAttr,
  Icon,
  itemAttr,
  literal,
  literalMedia,
  MediaImg,
  styleVars,
} from '../shared';
import { cx } from '../tw';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

/** The theme recolours the whole footer: its surface and every text inside. */
const THEME: Record<
  FooterProps['theme'],
  { root: string; heading: string; link: string; legal: string }
> = {
  ink: {
    root: 'bg-site-ink text-site-on-ink',
    heading: 'text-site-on-ink-muted',
    link: 'text-site-on-ink-link',
    legal: 'text-site-on-ink-muted',
  },
  paper: {
    root: 'border-t border-site-hairline bg-site-well text-site-ink',
    heading: 'text-site-ink-soft',
    link: 'text-site-ink',
    legal: 'text-site-ink-soft',
  },
};

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function FooterBlock(props: BlockProps<FooterProps>): ReactElement {
  const theme = THEME[props.theme] ?? THEME.ink;
  const { root, context, el, item } = blockParts(props, 'footer', theme.root);
  const legal = literal(props.legal, '');
  const columns = Math.max(1, Math.min(props.groups.length, 4));
  const logoMedia = literalMedia(props.logoMedia);
  const tagline = literal(props.tagline, '');
  const social = Array.isArray(props.social) ? props.social : [];
  const brand = Boolean(props.logo || logoMedia || tagline || social.length > 0);
  /* « Propulsé par Hlou » closes the legal row (decision 193): text first,
     the badge at the inline end; under 480 px the row stacks. */
  const attribution = readFooterAttribution(props.puck, props.id);

  return (
    <footer {...root}>
      <div
        className={cx(
          'mx-auto w-full max-w-site-content',
          brand && 'md:grid md:grid-cols-[1.2fr_2fr] md:gap-10'
        )}
      >
        {brand ? (
          <div {...el('brand', 'mb-8 md:mb-0')}>
            {logoMedia ? (
              <MediaImg
                field={fieldAttr(context, 'logoMedia')}
                media={logoMedia}
                alt={logoMedia.alt || props.logo || ''}
                className="mb-4 h-8 w-auto object-contain"
                sizes={MEDIA_SIZES_ATTR.logo}
              />
            ) : props.logo ? (
              <p className="mb-3 font-heading text-site-md">{props.logo}</p>
            ) : null}
            {tagline ? (
              <p className={cx('mb-4 max-w-[36ch] text-site-sm', theme.legal)}>{tagline}</p>
            ) : null}
            {social.length > 0 ? (
              <ul className="m-0 flex list-none gap-3 p-0" {...fieldAttr(context, 'social')}>
                {social.map((entry, index) => {
                  const label = literal(entry.label, '');
                  return (
                    <li key={`${entry.href}-${index}`} {...itemAttr(context, 'social', index)}>
                      <a
                        href={entry.href}
                        aria-label={label}
                        className={cx('inline-flex', theme.link)}
                      >
                        <Icon icon={entry.icon} className="size-5" title={label} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : null}
        <div>
          <div
            className="grid grid-cols-2 gap-5 max-[390px]:grid-cols-1 md:grid-cols-[repeat(var(--site-footer-cols,4),1fr)]"
            style={styleVars({ '--site-footer-cols': columns })}
            {...fieldAttr(context, 'groups')}
          >
            {props.groups.map((group, index) => {
              const heading = literal(group.heading, '');
              return (
                <nav
                  key={`${heading}-${index}`}
                  aria-label={heading}
                  {...item('groups', index, group, '', 'groups')}
                >
                  <p
                    className={cx(
                      'mb-2.25 text-site-xs tracking-[0.12em] uppercase',
                      theme.heading
                    )}
                  >
                    {heading}
                  </p>
                  <ul className="m-0 list-none p-0">
                    {group.items.map((link, itemIndex) => (
                      <li
                        key={`${link.href}-${itemIndex}`}
                        {...item(`groups[${index}].items`, itemIndex, link)}
                      >
                        <a
                          className={cx('mb-1.25 block text-site-sm', theme.link)}
                          href={link.href}
                        >
                          {literal(link.label, '')}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              );
            })}
          </div>
          {attribution ? (
            <div className="mt-5.5 flex flex-wrap items-center gap-4 max-[479px]:flex-col max-[479px]:items-start max-[479px]:gap-3">
              {legal ? (
                <p {...el('legal', cx('m-0 min-w-0 flex-1 text-site-xs', theme.legal))}>{legal}</p>
              ) : (
                <span className="flex-1" />
              )}
              <AttributionBadge
                attribution={attribution}
                locale={context.locale}
                dir={context.dir}
                placement="footer"
              />
            </div>
          ) : legal ? (
            <p {...el('legal', cx('mt-5.5 text-site-xs', theme.legal))}>{legal}</p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
