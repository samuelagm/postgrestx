[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [core/src](../README.md) / QueryResult

# Interface: QueryResult\<T\>

Defined in: [packages/core/src/postgrest/types.ts:81](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L81)

## Type Parameters

### T

`T`

## Properties

### data

> **data**: `T`

Defined in: [packages/core/src/postgrest/types.ts:82](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L82)

---

### total

> **total**: `null` \| `number`

Defined in: [packages/core/src/postgrest/types.ts:84](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L84)

Parsed from Content-Range if available; null if unknown

---

### range

> **range**: `null` \| \{ `from`: `number`; `to`: `null` \| `number`; `unit`: `string`; \}

Defined in: [packages/core/src/postgrest/types.ts:86](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L86)

Range as echoed by server; null if absent

---

### status

> **status**: `number`

Defined in: [packages/core/src/postgrest/types.ts:88](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L88)

Raw response status code
