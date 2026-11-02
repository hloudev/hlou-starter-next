/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

/* Scope state: the typed schema and its pure half — first
   values, derived estimates, `when`, formatting — shared by the server render
   pass, the browser runtime, the inspector and the agent. */
export {
  actionSchema,
  CATALOG_MAX,
  conditionSchema,
  currencyDigits,
  derivedSchema,
  isMoneyValue,
  isoDateSchema,
  isStateRef,
  priceOf,
  QUANTITY_MAX,
  scopeDefOf,
  scopeFieldSchema,
  scopeKeySchema,
  scopePropsSchema,
  scopeStepSchema,
  stateBoundSchema,
  stateRefSchema,
  whenSchema,
} from './schema';
export type {
  Action,
  CatalogEntry,
  Condition,
  ConditionOp,
  DateRangeValue,
  Derived,
  LineItem,
  LinesValue,
  MoneyValue,
  Operand,
  QuantitiesValue,
  ScopeDef,
  ScopeDefField,
  ScopeField,
  ScopeFieldType,
  ScopeSnapshot,
  StateBound,
  StateFormat,
  StateRef,
  When,
} from './schema';
export {
  clampNumber,
  coerceValue,
  daysBetween,
  emptyValue,
  initialValues,
  isIsoDate,
  quantityMax,
  storageKey,
  todayIso,
} from './initial';
export type { InitialInput, QueryInput } from './initial';
export { deriveAll, lintDerived } from './derive';
export type { DeriveLint } from './derive';
export {
  evaluateCondition,
  evaluateWhen,
  isEmptyValue,
  pathKey,
  readIn,
  readPath,
  readScoped,
  STEP_PATH,
  stepOfWhen,
} from './when';
export { formatState, intlLocale, MISSING_VALUE } from './format';
export type { FormatOptions } from './format';
/* The browser half: the store and the DOM runtime. The hook is
   `./react` — never here, because server modules import this index. */
export { clearScopes, createScopeStore, getScope, navigateHref, parseAction } from './store';
export type { ScopeErrorCode, ScopeEvent, ScopeStore, ScopeStoreOptions } from './store';
export {
  ACTION_ATTRIBUTE,
  BIND_ATTRIBUTE,
  SCOPE_ATTRIBUTE,
  SCOPE_DEF_ATTRIBUTE,
  scopeElement,
  startScopeRuntime,
  stopScopeRuntimes,
} from './dom';
