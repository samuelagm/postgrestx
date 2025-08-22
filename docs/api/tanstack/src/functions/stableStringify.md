[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / stableStringify

# Function: stableStringify()

> **stableStringify**(`value`): `string`

Defined in: [packages/tanstack/src/keys.ts:64](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/keys.ts#L64)

Deterministic JSON stringify: sorts object keys deeply so structurally
equivalent objects with different key insertion order produce identical
serialized strings. Used internally by [pgKey](../variables/pgKey.md).

## Parameters

### value

`unknown`

## Returns

`string`

## Example

```ts
stableStringify({ b: 1, a: 2 }) === stableStringify({ a: 2, b: 1 }) // true
```
