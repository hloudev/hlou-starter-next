/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ReactElement } from 'react';
import type { BlockProps } from '../types';
import type { FormClientProps } from './FormClient';
import type { FormProps } from './schema';
import { formDefaults } from './defaults';
import { regionNames } from './regions';

import { isResolvedForm } from '../../contracts';
import { Island } from '../../render/island';
import { stateMessages } from '../../site/messages';
import { firstDayOfWeek } from '../../widgets/calendar/locale';
import {
  BindBadge,
  blockParts,
  BUTTON_CLASSES,
  BUTTON_VARIANT_CLASSES,
  FloatingLayer,
  literal,
} from '../shared';
import { cx } from '../tw';
import { iconPaths, widgetScope } from '../widget-shell';

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * The starter passes the base `…/api/v1/public/forms/<projectId>/`; a trailing
 * slash means "append the form key". Anything else is posted to verbatim, and
 * an empty endpoint keeps the form disabled.
 */
export function resolveFormEndpoint(formEndpoint: string, formKey: string): string {
  if (formEndpoint === '') return '';
  return formEndpoint.endsWith('/') ? `${formEndpoint}${formKey}` : formEndpoint;
}

/** The step the render pass pinned on this block (`__hl.step`), else `null`. */
function pinnedStep(props: unknown): string | null {
  const side = (props as { __hl?: { step?: unknown } }).__hl;
  return typeof side?.step === 'string' ? side.step : null;
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * Server-safe shell: reads the render context (the only non-serialisable input)
 * and hands `FormClient` (through its `Island`) plain data, so the block renders from a server
 * component without a function crossing the client boundary — the error copy, the
 * country names sorted for the page's language, the calendar's first weekday.
 *
 * **Inside a scope** (M40-16) — one form per scope, on the step where the
 * visitor types; the scope's own fields reach the record through `fromState`
 * (drawn as nothing, read from the scope at submit), and with `hideSubmit` a
 * scope button (`{ do: 'submit' }`) sends it. The step the render pass pinned
 * (`__hl.step`) is the one the form validates on. Outside a scope both props
 * are ignored. The pattern is told in full on `FormClient`.
 */
export function FormBlock(props: BlockProps<FormProps>): ReactElement {
  const { root, context, el } = blockParts(props, 'form');
  const title = literal(props.title, formDefaults.title as string);
  const description = literal(props.description, '');
  const form = isResolvedForm(props.source) ? props.source : null;
  const formKey =
    form?.formKey ?? (props.source && '$form' in props.source ? props.source.$form : null);
  const scope = widgetScope(props);
  const messages = stateMessages(context.locale);
  const types = new Set(form?.fields.map((field) => field.type));

  return (
    <section {...root}>
      <div className="relative mx-auto w-full max-w-site-content">
        <div className="mb-4.5 flex items-center gap-2.5">
          {title ? <h2 {...el('title', 'mb-5.5 text-site-lg')}>{title}</h2> : null}
          {context.mode !== 'static' && formKey ? <BindBadge>form {formKey}</BindBadge> : null}
        </div>
        {description ? (
          <p {...el('description', '-mt-3 mb-5.5 max-w-[60ch] text-site-sm text-site-ink-soft')}>
            {description}
          </p>
        ) : null}
        {form ? (
          <Island
            name="form"
            markers={context.islands}
            props={
              {
                blockId: props.id,
                formKey: form.formKey,
                locale: context.locale,
                dir: context.dir,
                endpoint: resolveFormEndpoint(context.formEndpoint, form.formKey),
                buildId: context.formBuildId,
                ...(context.basePath ? { basePath: context.basePath } : {}),
                fields: form.fields,
                submitLabel: literal(props.submitLabel, ''),
                successMessage: literal(props.successMessage, ''),
                errorMessage: literal(props.errorMessage, ''),
                formAttrs: el('form', 'grid max-w-[560px] gap-3.5'),
                submitAttrs: el(
                  'submit',
                  cx(
                    BUTTON_CLASSES,
                    BUTTON_VARIANT_CLASSES.primary,
                    'disabled:cursor-not-allowed disabled:opacity-55'
                  )
                ),
                messages: { required: messages.errors.required, ...messages.form },
                dialLabel: messages.form.dialCode,
                errorIcon: iconPaths('warning-circle'),
                ...(types.has('phone') || types.has('country')
                  ? { countries: regionNames(context.locale) }
                  : {}),
                ...(types.has('daterange')
                  ? {
                      dates: {
                        firstDay: firstDayOfWeek(context.locale),
                        labels: {
                          ...messages.date,
                          close: messages.close,
                          nights: messages.nights,
                        },
                      },
                    }
                  : {}),
                inScope: scope !== null && context.mode !== 'canvas',
                step: pinnedStep(props),
                ...(scope && props.fromState ? { fromState: props.fromState } : {}),
                ...(scope && props.hideSubmit ? { hideSubmit: true } : {}),
              } satisfies FormClientProps
            }
          />
        ) : (
          <p className="font-mono text-site-xs text-site-ink-soft" data-hl-empty="true">
            {formKey ?? '—'}
          </p>
        )}
        {/* Over the content box, not the full-bleed section. */}
        <FloatingLayer slot={props.floating} />
      </div>
    </section>
  );
}
