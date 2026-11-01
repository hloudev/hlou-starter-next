/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/** The copy of the chrome around every site: skip link, redirects, 404. */
export type ChromeMessages = {
  skipToContent: string;
  /** `{locale}` is the target locale code. */
  redirecting: string;
  notFoundTitle: string;
  notFoundBody: string;
  backHome: string;
};

/** The copy of the « Propulsé par Hlou » badge. */
export type AttributionMessages = {
  /** The muted words before the brand name. */
  poweredBy: string;
  /** « Hlou », never translated. */
  brand: string;
  /** The whole sentence, for `aria-label` and `title`. */
  label: string;
};

/**
 * The copy of a scope's values and widgets on a rendered site (decision 199).
 * Plural forms are keyed by `Intl.PluralRules` category; `other` is required,
 * and `{n}` is the formatted count.
 */
export type StateMessages = {
  nights: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
  close: string;
  next: string;
  previous: string;
  /** `{n}` is the step's number, `{total}` the count. */
  stepOf: string;
  /** Beside every amount a scope derives: it is never a quote. */
  estimate: string;
  total: string;
  /** The scope's validation errors, by the code the store writes in `errors`. */
  errors: { required: string; chooseOne: string; invalidDates: string };
  /** The tabs block (M40-10): the canvas's band over each stacked panel, `{n}` its number. */
  tabs: { band: string };
  /** The modal block (M40-10): its close control, and the canvas's band (« Fenêtre · devis »). */
  modal: { close: string; band: string };
  /** The header's menus (M40-11); `{label}` is the parent link's label. */
  menu: { open: string; close: string; submenu: string };
  /** The carousel and the hero slider (M40-08). `{n}` / `{total}` are numbers. */
  carousel: {
    /** `aria-roledescription` of the region, and its label when it has no title. */
    region: string;
    /** `aria-roledescription` of one slide. */
    slide: string;
    /** A slide's label, and the lightbox's counter: « 2 sur 5 ». */
    of: string;
    goTo: string;
    prev: string;
    next: string;
    pause: string;
    play: string;
  };
  /** The gallery lightbox (M40-09). `{alt}` is the image's alt text. */
  lightbox: { dialog: string; prev: string; next: string; open: string };
  /**
   * The date picker and its calendar (M40-12). `minNights`: `{n}` is the
   * minimum stay; `arrival` / `departure` stand in for a blank split label.
   */
  date: {
    chooseOne: string;
    chooseRange: string;
    placeholder: string;
    prevMonth: string;
    nextMonth: string;
    clear: string;
    done: string;
    pickDeparture: string;
    minNights: string;
    unavailable: string;
    arrival: string;
    departure: string;
  };
  /** The quantity stepper (M40-13): `{label}` names the row, `{max}` its bound. */
  quantity: { dec: string; inc: string; max: string };
  /** Choice cards (M40-13): the selected card's mark, for screen readers. */
  choice: { selected: string };
  /** The step indicator (M40-14): its landmark, the done step's button (`{label}`). */
  steps: { label: string; back: string };
  /** The summary (M40-14): the estimate note under the card, the mobile bar's toggle. */
  summary: { note: string; showDetail: string; hideDetail: string };
  /** A widget in the canvas: not bound to a scope value, or a scope without steps. */
  widget: { unbound: string; noSteps: string };
  /**
   * The form block's per-field errors (M40-16), beside `errors.required`, and
   * the phone field's calling-code select.
   */
  form: { email: string; phone: string; money: string; dateOrder: string; dialCode: string };
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const MESSAGES: Record<'fr' | 'en' | 'ar', ChromeMessages> = {
  fr: {
    skipToContent: 'Aller au contenu',
    redirecting: 'Redirection vers {locale}…',
    notFoundTitle: 'Page introuvable',
    notFoundBody: 'Cette page n’existe pas ou a été déplacée.',
    backHome: 'Retour à l’accueil',
  },
  en: {
    skipToContent: 'Skip to content',
    redirecting: 'Redirecting to {locale}…',
    notFoundTitle: 'Page not found',
    notFoundBody: 'This page does not exist or has moved.',
    backHome: 'Back to the home page',
  },
  ar: {
    skipToContent: 'الانتقال إلى المحتوى',
    redirecting: 'جارٍ التحويل إلى {locale}…',
    notFoundTitle: 'الصفحة غير موجودة',
    notFoundBody: 'هذه الصفحة غير موجودة أو تم نقلها.',
    backHome: 'العودة إلى الرئيسية',
  },
};

/** « Hlou » is a name: it never translates, so only the words before it do. */
const ATTRIBUTION_POWERED_BY: Record<'fr' | 'en' | 'ar', string> = {
  fr: 'Propulsé par',
  en: 'Powered by',
  ar: 'مدعوم من',
};

const ATTRIBUTION_BRAND = 'Hlou';

/* Apart from the rest of the state copy: the scope runtime formats nights in
   the browser, and ships only this table (its 4 KB budget). */
const NIGHTS: Record<'fr' | 'en' | 'ar', StateMessages['nights']> = {
  fr: { one: '{n} nuit', other: '{n} nuits' },
  en: { one: '{n} night', other: '{n} nights' },
  ar: {
    zero: '{n} ليلة',
    one: 'ليلة واحدة',
    two: 'ليلتان',
    few: '{n} ليالٍ',
    many: '{n} ليلة',
    other: '{n} ليلة',
  },
};

const STATE_MESSAGES: Record<'fr' | 'en' | 'ar', Omit<StateMessages, 'nights'>> = {
  fr: {
    close: 'Fermer',
    next: 'Suivant',
    previous: 'Précédent',
    stepOf: 'Étape {n} sur {total}',
    estimate: 'Estimation',
    total: 'Total',
    errors: {
      required: 'Ce champ est obligatoire',
      chooseOne: 'Choisissez au moins une option',
      invalidDates: 'Dates invalides',
    },
    tabs: { band: 'Onglet {n}' },
    modal: { close: 'Fermer', band: 'Fenêtre' },
    menu: {
      open: 'Ouvrir le menu',
      close: 'Fermer le menu',
      submenu: 'Afficher le sous-menu {label}',
    },
    carousel: {
      region: 'Carrousel',
      slide: 'diapositive',
      of: '{n} sur {total}',
      goTo: 'Aller à la diapositive {n}',
      prev: 'Diapositive précédente',
      next: 'Diapositive suivante',
      pause: 'Mettre le défilement en pause',
      play: 'Reprendre le défilement',
    },
    lightbox: {
      dialog: 'Visionneuse d’images',
      prev: 'Image précédente',
      next: 'Image suivante',
      open: 'Agrandir l’image : {alt}',
    },
    date: {
      chooseOne: 'Choisir une date',
      chooseRange: 'Choisir les dates',
      placeholder: 'jj/mm/aaaa',
      prevMonth: 'Mois précédent',
      nextMonth: 'Mois suivant',
      clear: 'Effacer',
      done: 'Valider',
      pickDeparture: 'Choisissez la date de départ',
      minNights: '{n} nuits au minimum',
      unavailable: 'Date indisponible',
      arrival: 'Arrivée',
      departure: 'Départ',
    },
    quantity: { dec: 'Retirer : {label}', inc: 'Ajouter : {label}', max: '{max} au maximum' },
    choice: { selected: 'Choisi' },
    steps: { label: 'Étapes', back: 'Revenir à l’étape {label}' },
    summary: {
      note: 'Montant indicatif, confirmé par l’établissement.',
      showDetail: 'Voir le détail',
      hideDetail: 'Masquer le détail',
    },
    widget: { unbound: 'Non lié', noSteps: 'Aucune étape' },
    form: {
      email: 'Adresse e-mail invalide',
      phone: 'Numéro de téléphone invalide',
      money: 'Montant invalide',
      dateOrder: 'La date de fin doit suivre la date de début',
      dialCode: 'Indicatif du pays',
    },
  },
  en: {
    close: 'Close',
    next: 'Next',
    previous: 'Previous',
    stepOf: 'Step {n} of {total}',
    estimate: 'Estimate',
    total: 'Total',
    errors: {
      required: 'This field is required',
      chooseOne: 'Choose at least one option',
      invalidDates: 'Invalid dates',
    },
    tabs: { band: 'Tab {n}' },
    modal: { close: 'Close', band: 'Dialog' },
    menu: { open: 'Open the menu', close: 'Close the menu', submenu: 'Show the {label} submenu' },
    carousel: {
      region: 'Carousel',
      slide: 'slide',
      of: '{n} of {total}',
      goTo: 'Go to slide {n}',
      prev: 'Previous slide',
      next: 'Next slide',
      pause: 'Pause the slideshow',
      play: 'Play the slideshow',
    },
    lightbox: {
      dialog: 'Image viewer',
      prev: 'Previous image',
      next: 'Next image',
      open: 'Enlarge image: {alt}',
    },
    date: {
      chooseOne: 'Choose a date',
      chooseRange: 'Choose the dates',
      placeholder: 'dd/mm/yyyy',
      prevMonth: 'Previous month',
      nextMonth: 'Next month',
      clear: 'Clear',
      done: 'Done',
      pickDeparture: 'Pick the departure date',
      minNights: '{n} nights minimum',
      unavailable: 'Unavailable date',
      arrival: 'Check-in',
      departure: 'Check-out',
    },
    quantity: { dec: 'Fewer: {label}', inc: 'More: {label}', max: '{max} at most' },
    choice: { selected: 'Selected' },
    steps: { label: 'Steps', back: 'Back to {label}' },
    summary: {
      note: 'An indicative amount, confirmed by the venue.',
      showDetail: 'See the details',
      hideDetail: 'Hide the details',
    },
    widget: { unbound: 'Not bound', noSteps: 'No steps' },
    form: {
      email: 'Invalid email address',
      phone: 'Invalid phone number',
      money: 'Invalid amount',
      dateOrder: 'The end date must follow the start date',
      dialCode: 'Country calling code',
    },
  },
  ar: {
    close: 'إغلاق',
    next: 'التالي',
    previous: 'السابق',
    stepOf: 'الخطوة {n} من {total}',
    estimate: 'تقدير',
    total: 'المجموع',
    errors: {
      required: 'هذا الحقل مطلوب',
      chooseOne: 'اختر خيارًا واحدًا على الأقل',
      invalidDates: 'تواريخ غير صالحة',
    },
    tabs: { band: 'تبويب {n}' },
    modal: { close: 'إغلاق', band: 'نافذة' },
    menu: {
      open: 'فتح القائمة',
      close: 'إغلاق القائمة',
      submenu: 'إظهار القائمة الفرعية {label}',
    },
    carousel: {
      region: 'دوّارة',
      slide: 'شريحة',
      of: '{n} من {total}',
      goTo: 'انتقل إلى الشريحة {n}',
      prev: 'الشريحة السابقة',
      next: 'الشريحة التالية',
      pause: 'إيقاف العرض مؤقتًا',
      play: 'استئناف العرض',
    },
    lightbox: {
      dialog: 'عارض الصور',
      prev: 'الصورة السابقة',
      next: 'الصورة التالية',
      open: 'تكبير الصورة: {alt}',
    },
    date: {
      chooseOne: 'اختر تاريخًا',
      chooseRange: 'اختر التواريخ',
      placeholder: 'يوم/شهر/سنة',
      prevMonth: 'الشهر السابق',
      nextMonth: 'الشهر التالي',
      clear: 'مسح',
      done: 'تم',
      pickDeparture: 'اختر تاريخ المغادرة',
      minNights: '{n} ليالٍ على الأقل',
      unavailable: 'تاريخ غير متاح',
      arrival: 'الوصول',
      departure: 'المغادرة',
    },
    quantity: { dec: 'إنقاص: {label}', inc: 'زيادة: {label}', max: '{max} على الأكثر' },
    choice: { selected: 'محدّد' },
    steps: { label: 'الخطوات', back: 'العودة إلى {label}' },
    summary: {
      note: 'مبلغ تقريبي، تؤكّده المنشأة.',
      showDetail: 'عرض التفاصيل',
      hideDetail: 'إخفاء التفاصيل',
    },
    widget: { unbound: 'غير مرتبط', noSteps: 'لا خطوات' },
    form: {
      email: 'عنوان بريد إلكتروني غير صالح',
      phone: 'رقم هاتف غير صالح',
      money: 'مبلغ غير صالح',
      dateOrder: 'يجب أن يلي تاريخ النهاية تاريخ البداية',
      dialCode: 'رمز الاتصال الدولي',
    },
  },
};

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/** The chrome copy for a locale; French — Hlou's first locale — for any other. */
export function chromeMessages(locale: string): ChromeMessages {
  return locale in MESSAGES ? MESSAGES[locale as keyof typeof MESSAGES] : MESSAGES.fr;
}

/**
 * The badge copy for a locale, matched on its primary subtag (`fr-CA` → `fr`).
 * Unlike the chrome, an unknown locale falls back to ENGLISH, not French: the
 * badge speaks to a site's visitors, and a German page is better served by
 * « Powered by » than by « Propulsé par ».
 */
export function attributionMessages(locale: string): AttributionMessages {
  const primary = locale.toLowerCase().split(/[-_]/)[0] ?? '';
  const poweredBy =
    primary in ATTRIBUTION_POWERED_BY
      ? ATTRIBUTION_POWERED_BY[primary as keyof typeof ATTRIBUTION_POWERED_BY]
      : ATTRIBUTION_POWERED_BY.en;
  return { poweredBy, brand: ATTRIBUTION_BRAND, label: `${poweredBy} ${ATTRIBUTION_BRAND}` };
}

/** A locale's primary subtag among Hlou's three; French — Hlou's first — for any other. */
function stateLocale(locale: string): 'fr' | 'en' | 'ar' {
  const primary = locale.toLowerCase().split(/[-_]/)[0] ?? '';
  return primary === 'en' || primary === 'ar' ? primary : 'fr';
}

/** The plural forms of « n nuits » for a locale. */
export function nightsMessages(locale: string): StateMessages['nights'] {
  return NIGHTS[stateLocale(locale)];
}

/**
 * The copy of scope values and widgets for a locale, matched on its primary
 * subtag; French — Hlou's first locale — for any other, as the chrome.
 */
export function stateMessages(locale: string): StateMessages {
  const code = stateLocale(locale);
  return { nights: NIGHTS[code], ...STATE_MESSAGES[code] };
}

/** `{n}` / `{total}` / `{alt}` in a widget string, replaced by their values. */
export function fillMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}
