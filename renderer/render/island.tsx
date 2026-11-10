/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { ComponentProps, ReactElement } from 'react';

import { CarouselClient } from '../blocks/carousel/CarouselClient';
import { ChoiceCardsClient } from '../blocks/choiceCards/ChoiceCardsClient';
import { DatePickerClient } from '../blocks/datePicker/DatePickerClient';
import { FormClient } from '../blocks/form/FormClient';
import { LightboxClient } from '../blocks/gallery/LightboxClient';
import { MenuClient } from '../blocks/header/MenuClient';
import { LiveListClient } from '../blocks/listings/LiveListClient';
import { ModalClient } from '../blocks/modal/ModalClient';
import { QuantityClient } from '../blocks/quantity/QuantityClient';
import { ScopeRuntimeClient } from '../blocks/scope/ScopeRuntimeClient';
import { StepsClient } from '../blocks/steps/StepsClient';
import { SummaryClient } from '../blocks/summary/SummaryClient';
import { TabsClient } from '../blocks/tabs/TabsClient';
import { ThemeToggleClient } from '../blocks/themeToggle/ThemeToggleClient';
import { MotionRuntimeClient } from '../motion/MotionRuntimeClient';

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Every client component a site renders — the only code a published page
 * ever runs. The kernel's client entry hydrates each marker with the
 * component of the same name, so there is one implementation of each.
 */
export const ISLANDS = {
  carousel: CarouselClient,
  choiceCards: ChoiceCardsClient,
  datePicker: DatePickerClient,
  form: FormClient,
  lightbox: LightboxClient,
  liveList: LiveListClient,
  menu: MenuClient,
  modal: ModalClient,
  /* The page motion runtime: renders nothing, plays every `data-hl-motion`. */
  motion: MotionRuntimeClient,
  quantity: QuantityClient,
  scope: ScopeRuntimeClient,
  steps: StepsClient,
  summary: SummaryClient,
  tabs: TabsClient,
  themeToggle: ThemeToggleClient,
} as const;

export type IslandName = keyof typeof ISLANDS;

/** The attribute a marker carries its island's name in. */
export const ISLAND_ATTRIBUTE = 'data-hl-island';
/** The attribute a marker carries its island's props in, as JSON. */
export const ISLAND_PROPS_ATTRIBUTE = 'data-hl-island-props';

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

/**
 * A client component's boundary. By default it renders the component as is —
 * Next hydrates the whole page and reaches it that way. With `markers` (the
 * kernel, via the render context's `islands`), it wraps the server HTML in a
 * `display: contents` marker that names the component and carries its
 * props, which `hydrateIslands` hydrates alone. Props must be plain JSON.
 */
export function Island<K extends IslandName>({
  name,
  props,
  markers = false,
}: {
  name: K;
  props: ComponentProps<(typeof ISLANDS)[K]>;
  markers?: boolean;
}): ReactElement {
  /* The name picks the component its props were typed against. */
  const Component = ISLANDS[name] as (props: object) => ReactElement;
  const element = <Component {...props} />;
  if (!markers) return element;
  return (
    <div
      {...{ [ISLAND_ATTRIBUTE]: name, [ISLAND_PROPS_ATTRIBUTE]: JSON.stringify(props) }}
      style={{ display: 'contents' }}
    >
      {element}
    </div>
  );
}
