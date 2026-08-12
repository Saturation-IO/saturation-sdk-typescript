/**
 * Type-level `expand` machinery: return-type widening.
 *
 * An expand key inlines a related entity into the response. The OpenAPI emits
 * that relation as an *optional* property on the resource (e.g. `BudgetLine.contact?`).
 * Read raw, those optionals force `?.` sprawl at every call site even when you
 * asked for them. This module widens the return type so that:
 *
 *   - a relation you expanded is **present and non-optional** (no `?.` needed), and
 *   - a relation you did not expand is **absent** from the type (accessing it is a
 *     compile error, not a silent `undefined`).
 *
 * Each resource declares an `ExpandMap`: a record from its typed expand-key union
 * to the property name that key populates. `phases` populates `values`,
 * `phaseData` populates `phaseData`, `contact` populates `contact`, and so on. The widening is
 * driven entirely by that map, so the surface stays mechanical and the keys stay
 * the OpenAPI's typed union (never a free string).
 */

/**
 * A map from (a subset of) a resource's expand-key union to the property each key
 * populates. Only keys with a dedicated, OpenAPI-typed relation property appear;
 * keys that merely project already-inline fields are valid `expand` values but are
 * absent from the map (so the return type is honest about what it can promise).
 */
export type ExpandMap<TKey extends string> = Partial<Record<TKey, string>>;

/** The property names a set of requested keys `K` populate, per the map. */
type PresentProps<TMap, K extends PropertyKey> = K extends keyof TMap
  ? TMap[K] extends string
    ? TMap[K]
    : never
  : never;

/** Every property name any key in the map could populate (the widening targets). */
type AllExpandTargets<TMap> = TMap[keyof TMap] extends string ? TMap[keyof TMap] : never;

/**
 * Widen `T` for a set of requested expand keys `K`:
 *   - properties named by an expanded key become required (`-?`) and non-undefined,
 *   - the other mapped expand-target properties are stripped from the type entirely,
 *     so an un-expanded relation is *absent* (accessing it is a compile error, not a
 *     silent `undefined`).
 *
 * Keys outside the map widen nothing (they are valid `expand` values that project
 * fields already inline on `T`).
 */
export type Expanded<T, TMap, K extends string> = Omit<T, AllExpandTargets<TMap>> & {
  [P in Extract<keyof T, PresentProps<TMap, K>>]-?: Exclude<T[P], undefined>;
};

/**
 * Serialize an expand-key array to the comma-list `expand=a,b` form the API
 * expects (`style: form, explode: false`). Returns `undefined` for an empty/absent
 * list so the param is omitted rather than sent blank.
 */
export function serializeExpand<K extends string>(keys?: readonly K[]): K[] | undefined {
  if (!keys || keys.length === 0) return undefined;
  return [...keys];
}
