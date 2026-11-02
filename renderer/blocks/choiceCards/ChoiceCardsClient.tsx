'use client';

/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */
import type { ReactElement } from 'react';
import type { WidgetImage, WidgetStyled } from '../widget-client';

import { useScopeState } from '../../state/react';
import { useLive, useScopeError, WidgetError, WidgetIcon } from '../widget-client';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** One option, as the server shell shaped it from the field and the decor. */
export type ChoiceOption = {
  value: string;
  label: string;
  /** Formatted. */
  price?: string;
  description?: string;
  badge?: string;
  icon?: string[];
  image?: WidgetImage;
};

export type ChoiceCardsClientProps = {
  /** The scope's id; `''` in the canvas (inert). */
  scope: string;
  /** The `choice` field's key. */
  path: string;
  /** The radios' group name: `hl-<blockId>`, never the bare path (two scopes, one page). */
  name: string;
  look: 'cards' | 'segmented' | 'list';
  legend: string;
  required: boolean;
  options: ChoiceOption[];
  /** The render-time value. */
  value: string | null;
  /** The fieldset's legend (`label`), each option (`options`), the options' row (`grid`). */
  cls: Record<'label' | 'options' | 'grid', WidgetStyled>;
  errors: Record<string, string>;
  icons: { check: string[]; warning: string[] };
};

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * The choice cards island: a fieldset of NATIVE radios, each inside
 * its `<label>` card — so the radio-group keyboard (arrows move and select,
 * in the visual direction, RTL included) and `required` come from the
 * browser, and a page without script still checks. The selected look is CSS
 * (`:has(:checked)`); the island only dispatches `set` on `change`.
 */
export function ChoiceCardsClient(props: ChoiceCardsClientProps): ReactElement {
  const { scope, path, look, cls, icons } = props;
  const [raw, dispatch] = useScopeState<unknown>(scope, path, props.value);
  const value = typeof raw === 'string' ? raw : null;
  const live = useLive(scope);
  const code = useScopeError(scope, path);
  const error = code ? (props.errors[code] ?? code) : '';
  const errorId = `${props.name}-error`;

  const radio = (option: ChoiceOption, index: number) => (
    <input
      type="radio"
      className="hl-choice__input sr-only"
      name={props.name}
      value={option.value}
      checked={value === option.value}
      required={props.required || undefined}
      disabled={scope === '' || undefined}
      {...(index === 0 ? { 'data-hl-field-for': path } : {})}
      onChange={() => {
        if (live) dispatch({ do: 'set', path, value: option.value });
      }}
    />
  );
  const mark = (
    <span className="hl-choice__radio grid size-[1.375rem] shrink-0 place-items-center rounded-full border-[1.5px] border-site-hairline-strong text-site-on-accent group-has-checked:border-site-accent group-has-checked:bg-site-accent">
      <WidgetIcon d={icons.check} className="size-3.5 opacity-0 group-has-checked:opacity-100" />
    </span>
  );

  return (
    <fieldset
      role="radiogroup"
      className={`hl-choices hl-choices--${look} group/choices m-0 min-w-0 border-0 p-0`}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      aria-required={props.required || undefined}
    >
      {props.legend ? <legend {...cls.label}>{props.legend}</legend> : null}
      <div {...cls.grid}>
        {props.options.map((option, index) => (
          <label key={option.value} {...cls.options}>
            {radio(option, index)}
            {look === 'segmented' ? (
              <>
                <span>{option.label}</span>
                {option.price ? (
                  <small className="text-site-xs tabular-nums opacity-85">{option.price}</small>
                ) : null}
              </>
            ) : look === 'list' ? (
              <>
                {mark}
                <span className="grid min-w-0 flex-1">
                  <span className="font-medium">{option.label}</span>
                  {option.description ? (
                    <span className="text-site-xs text-site-ink-soft">{option.description}</span>
                  ) : null}
                </span>
                {option.price ? (
                  <span className="text-site-accent tabular-nums">{option.price}</span>
                ) : null}
              </>
            ) : (
              <>
                {option.image ? (
                  <img
                    {...option.image}
                    className="hl-choice__media mb-1 aspect-[16/10] w-full rounded-site object-cover"
                  />
                ) : null}
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-site-xs font-medium tracking-[0.1em] uppercase">
                    {option.icon ? (
                      <WidgetIcon d={option.icon} className="size-5 text-site-accent" />
                    ) : null}
                    {option.label}
                  </span>
                  {mark}
                </span>
                {option.badge ? (
                  <span className="w-fit rounded-site-pill bg-site-accent-soft px-2 py-0.5 text-site-xs text-site-accent">
                    {option.badge}
                  </span>
                ) : null}
                {option.price ? (
                  <span className="font-heading text-site-lg leading-[1.1] text-site-accent tabular-nums">
                    {option.price}
                  </span>
                ) : null}
                {option.description ? (
                  <span className="text-site-sm text-site-ink-soft">{option.description}</span>
                ) : null}
              </>
            )}
          </label>
        ))}
      </div>
      {error ? <WidgetError id={errorId} text={error} icon={icons.warning} /> : null}
    </fieldset>
  );
}
