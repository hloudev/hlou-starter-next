/* -------------------------------------------------------------------------- */
/*                                DEPENDENCIES                                */
/* -------------------------------------------------------------------------- */

import type { Action, ScopeDef, ScopeSnapshot } from './schema';
import { deriveAll } from './derive';
import { coerceValue, initialValues, storageKey, todayIso } from './initial';
import { isRecord, parseJson } from './values';
import { isEmptyValue, pathKey, readPath, STEP_PATH } from './when';

import { prefixHref } from '../resolve/href';

/* No React, no zod: this ships to the browser inside the scope island's 4 KB
. Actions are checked by hand (`parseAction`), and every
   value written goes through `coerceValue`, which clamps it. */

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export type ScopeEvent = 'submit' | 'submitted' | 'reset';

/** The code `validate` writes in `errors[path]`; `StateMessages.errors` words it. */
export type ScopeErrorCode = 'required' | 'chooseOne' | 'invalidDates';

export interface ScopeStore {
  readonly id: string;
  readonly def: ScopeDef;
  get(): ScopeSnapshot;
  read(path: string): unknown;
  subscribe(fn: () => void): () => void;
  dispatch(action: Action): void;
  /** The required fields of `step` (default: the current one) and its validators. */
  validate(step?: string): boolean;
  /** `step: null` runs on every step. */
  registerValidator(step: string | null, fn: () => boolean): () => void;
  on(event: ScopeEvent, fn: () => void): () => void;
  /** The form island calls it on success: emits `submitted`, resets, clears storage. */
  submitted(): void;
}

type ScopeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type ScopeStoreOptions = {
  /** Where `persist: 'session'` writes; `null` persists nothing. Defaults to `sessionStorage`. */
  storage?: ScopeStorage | null;
  /** The page path the storage key names. Defaults to `location.pathname`. */
  path?: string;
  /** Follows a `navigate`. Defaults to `location.assign`. */
  navigate?: (href: string) => void;
  /** Prefixed to a root-relative `navigate` href (the resolver usually did it already). */
  basePath?: string;
  /** `YYYY-MM-DD`; defaults to the clock's. */
  today?: string;
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

/** Each action, and the props it must name as strings: the hand-written twin of `actionSchema`. */
const ACTION_STRINGS: Record<string, readonly string[]> = {
  set: ['path'],
  inc: ['path'],
  dec: ['path'],
  toggle: ['path'],
  reset: [],
  'step.next': [],
  'step.prev': [],
  'step.go': ['step'],
  submit: [],
  navigate: ['href'],
};

/** A scheme in front of an href: only `http(s)` may navigate. */
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function registry(): Map<string, ScopeStore> {
  const holder = globalThis as { __hlScopes?: Map<string, ScopeStore> };
  return (holder.__hlScopes ??= new Map());
}

/** The browser's sessionStorage, or `null` (none, or blocked). */
function browserStorage(): ScopeStorage | null {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

/** The scope element of `id` on the page. */
export function findScope(id: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>('[data-hl-scope]')].find(
    (element) => element.getAttribute('data-hl-scope') === id
  );
}

/**
 * A JSON value as an action, or `null`. Optional props are not checked here:
 * `dispatch` reads `by`, `key` and `query` defensively.
 */
export function parseAction(value: unknown): Action | null {
  const strings = isRecord(value) ? ACTION_STRINGS[String(value.do)] : undefined;
  if (!strings || !isRecord(value) || strings.some((key) => typeof value[key] !== 'string')) {
    return null;
  }
  if (value.do === 'set' && typeof value.value === 'object' && value.value !== null) return null;
  return value as Action;
}

/**
 * `href` with `query` (`param → path`) filled from the scope, or `null` when
 * it is not a relative or `http(s)` link. A value that is not a string or a
 * number (an object, nothing yet) leaves its parameter out.
 */
export function navigateHref(
  href: string,
  query: Record<string, string> | undefined,
  read: (path: string) => unknown,
  basePath = ''
): string | null {
  /* Browsers ignore whitespace and controls inside a scheme (`java\tscript:`). */
  const bare = [...href].filter((char) => char > ' ' && char !== '\u007f').join('');
  const scheme = SCHEME.exec(bare)?.[1]?.toLowerCase();
  if (scheme && scheme !== 'http' && scheme !== 'https') return null;
  const params = new URLSearchParams();
  for (const [param, path] of Object.entries(query ?? {})) {
    const value = read(path);
    if ((typeof value === 'string' && value) || (typeof value === 'number' && value === value)) {
      params.set(param, String(value));
    }
  }
  const full = prefixHref(href.trim(), basePath);
  const search = params.toString();
  if (!search) return full;
  const cut = full.includes('#') ? full.indexOf('#') : full.length;
  const path = full.slice(0, cut);
  return `${path}${path.includes('?') ? '&' : '?'}${search}${full.slice(cut)}`;
}

/* -------------------------------------------------------------------------- */
/*                                  FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * A scope's store, registered as `getScope(def.id)`: its values, derived
 * values (recomputed on every dispatch), step and errors. With `persist:
 * 'session'` the scope's values — never a form's inputs — are written to
 * sessionStorage on every change and cleared by `submitted()`.
 */
export function createScopeStore(
  def: ScopeDef,
  initial: Record<string, unknown>,
  options: ScopeStoreOptions = {}
): ScopeStore {
  const storage = options.storage === undefined ? browserStorage() : options.storage;
  const today = options.today ?? todayIso();
  const key = storageKey(options.path ?? location.pathname, def.id);
  const defaults = () => initialValues(def, { today });
  const fields = new Map(def.fields.map((field) => [field.key, field]));
  const steps = def.steps.map((step) => step.id);
  const listeners = new Set<() => void>();
  const handlers = new Set<{ event: ScopeEvent; fn: () => void }>();
  const validators = new Set<{ step: string | null; fn: () => boolean }>();

  let snapshot: ScopeSnapshot = {
    values: initial,
    derived: deriveAll(def, initial),
    step: steps[0] ?? null,
    errors: {},
  };

  const emit = (event: ScopeEvent) => {
    for (const handler of handlers) if (handler.event === event) handler.fn();
  };

  const commit = (next: Partial<ScopeSnapshot>) => {
    const { values } = next;
    snapshot = { ...snapshot, ...next, ...(values && { derived: deriveAll(def, values) }) };
    if (values && def.persist === 'session') {
      try {
        storage?.setItem(key, JSON.stringify(values));
      } catch {
        /* Full or blocked: the page still works, it just forgets. */
      }
    }
    for (const fn of listeners) fn();
  };

  /**
   * Writes `path` (a key, or one dotted level), coerced; a value that is not
   * one is refused. Writing a field clears its error.
   */
  const write = (path: string, value: unknown) => {
    const field = fields.get(pathKey(path));
    if (!field) return;
    let raw = value;
    if (path !== field.key) {
      const sub = path.slice(field.key.length + 1);
      const current = snapshot.values[field.key];
      raw = { ...(isRecord(current) && current), [sub]: value };
      /* A new start drops an end it no longer fits, rather than being refused. */
      if (sub === 'from' && coerceValue(field, raw, def, today) === undefined) {
        raw = { from: value, to: null };
      }
    }
    const coerced = coerceValue(field, raw, def, today);
    if (coerced === undefined) return;
    const { [field.key]: _cleared, ...errors } = snapshot.errors;
    commit({ values: { ...snapshot.values, [field.key]: coerced }, errors });
  };

  const goTo = (step: string | undefined) => {
    if (step !== undefined && steps.includes(step)) commit({ step });
  };

  const store: ScopeStore = {
    id: def.id,
    def,
    get: () => snapshot,
    read: (path) => readPath(snapshot, path),
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    on(event, fn) {
      const handler = { event, fn };
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    registerValidator(step, fn) {
      const validator = { step, fn };
      validators.add(validator);
      return () => validators.delete(validator);
    },
    validate(step = snapshot.step ?? undefined) {
      const errors: Record<string, string> = {};
      for (const field of def.fields) {
        if (!field.required || (steps.length > 0 && field.onStep !== step)) continue;
        const value = snapshot.values[field.key];
        const missing =
          field.type === 'number'
            ? typeof value !== 'number'
            : field.type === 'boolean'
              ? value !== true
              : isEmptyValue(value);
        if (missing) {
          errors[field.key] =
            field.type === 'dateRange'
              ? 'invalidDates'
              : field.type === 'quantities'
                ? 'chooseOne'
                : 'required';
        }
      }
      const first = Object.keys(errors)[0];
      let ok = !first;
      for (const validator of validators) {
        if (validator.step === null || validator.step === step) ok = validator.fn() && ok;
      }
      commit({ errors });
      if (first && typeof document !== 'undefined') {
        findScope(def.id)
          ?.querySelector<HTMLElement>(
            `[data-hl-field-for="${first}"],[data-hl-bind^='{"p":"${first}"']`
          )
          ?.focus();
      }
      return ok;
    },
    dispatch(action) {
      const at = steps.indexOf(snapshot.step ?? '');
      switch (action.do) {
        case 'set':
          if (action.path === STEP_PATH) goTo(String(action.value));
          else write(action.path, action.value);
          return;
        case 'inc':
        case 'dec': {
          const field = fields.get(pathKey(action.path));
          const sign = action.do === 'inc' ? 1 : -1;
          const by = typeof action.by === 'number' ? action.by : undefined;
          if (field?.type === 'number') {
            const current = snapshot.values[field.key];
            const base = typeof current === 'number' ? current : (field.min ?? 0);
            write(field.key, base + sign * (by ?? field.increment ?? 1));
          } else if (field?.type === 'quantities') {
            const item =
              typeof action.key === 'string' ? action.key : action.path.slice(field.key.length + 1);
            const current = snapshot.values[field.key];
            const qty = isRecord(current) ? Number(current[item] ?? 0) : 0;
            if (item) write(`${field.key}.${item}`, Math.max(0, qty + sign * (by ?? 1)));
          }
          return;
        }
        case 'toggle':
          if (fields.get(action.path)?.type === 'boolean') {
            write(action.path, snapshot.values[action.path] !== true);
          }
          return;
        case 'reset': {
          const fresh = defaults();
          const field = action.path ? fields.get(pathKey(action.path)) : undefined;
          if (field) {
            const { [field.key]: _cleared, ...errors } = snapshot.errors;
            commit({ values: { ...snapshot.values, [field.key]: fresh[field.key] }, errors });
          } else if (action.path) {
            return;
          } else {
            commit({ values: fresh, step: steps[0] ?? null, errors: {} });
          }
          emit('reset');
          return;
        }
        case 'step.next':
          if (store.validate()) goTo(steps[at + 1]);
          return;
        case 'step.prev':
          goTo(steps[at - 1]);
          return;
        case 'step.go':
          goTo(action.step);
          return;
        case 'submit':
          emit('submit');
          return;
        case 'navigate': {
          const query = isRecord(action.query) ? action.query : undefined;
          const href = navigateHref(action.href, query, store.read, options.basePath);
          if (href !== null) (options.navigate ?? ((to) => location.assign(to)))(href);
          return;
        }
        default:
          return;
      }
    },
    submitted() {
      emit('submitted');
      commit({ values: defaults(), step: steps[0] ?? null, errors: {} });
      try {
        storage?.removeItem(key);
      } catch {
        /* Blocked storage holds nothing to clear. */
      }
    },
  };
  registry().set(def.id, store);
  return store;
}

/**
 * The store of scope `id`. In a browser it is built on first ask from the
 * page — `[data-hl-scope="<id>"]`'s `data-hl-scope-def`, the stored values,
 * the URL — so a widget island hydrating before the scope island finds it.
 * Elsewhere, and for an id the page does not hold, `null`.
 */
export function getScope(id: string): ScopeStore | null {
  const held = registry().get(id);
  if (held || typeof document === 'undefined') return held ?? null;
  const def = parseJson(findScope(id)?.getAttribute('data-hl-scope-def')) as ScopeDef | null;
  if (!isRecord(def) || def.id !== id) return null;
  const storage = browserStorage();
  let stored: unknown = null;
  try {
    if (def.persist === 'session')
      stored = parseJson(storage?.getItem(storageKey(location.pathname, id)));
  } catch {
    /* Blocked storage: nothing stored. */
  }
  const today = todayIso();
  const values = initialValues(def, {
    storage: isRecord(stored) ? stored : null,
    query: location.search,
    today,
  });
  return createScopeStore(def, values, { storage, today });
}

/** Forgets every store (tests, and a page swapped without a reload). */
export function clearScopes(): void {
  registry().clear();
}
