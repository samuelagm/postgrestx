[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / RpcQueryParams

# Interface: RpcQueryParams

Defined in: [packages/tanstack/src/index.ts:19](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L19)

## Extends

- `Omit`\<[`QueryOptions`](../../../core/src/interfaces/QueryOptions.md), `"headers"`\>

## Properties

### select?

> `optional` **select**: `string`

Defined in: [packages/core/src/postgrest/types.ts:68](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L68)

#### Inherited from

[`QueryOptions`](../../../core/src/interfaces/QueryOptions.md).[`select`](../../../core/src/interfaces/QueryOptions.md#select)

---

### filters?

> `optional` **filters**: [`Filter`](../../../core/src/interfaces/Filter.md)[]

Defined in: [packages/core/src/postgrest/types.ts:69](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L69)

#### Inherited from

[`QueryOptions`](../../../core/src/interfaces/QueryOptions.md).[`filters`](../../../core/src/interfaces/QueryOptions.md#filters)

---

### order?

> `optional` **order**: `string` \| `string`[]

Defined in: [packages/core/src/postgrest/types.ts:70](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L70)

#### Inherited from

[`QueryOptions`](../../../core/src/interfaces/QueryOptions.md).[`order`](../../../core/src/interfaces/QueryOptions.md#order)

---

### limit?

> `optional` **limit**: `number`

Defined in: [packages/core/src/postgrest/types.ts:71](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L71)

#### Inherited from

[`QueryOptions`](../../../core/src/interfaces/QueryOptions.md).[`limit`](../../../core/src/interfaces/QueryOptions.md#limit)

---

### offset?

> `optional` **offset**: `number`

Defined in: [packages/core/src/postgrest/types.ts:72](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L72)

#### Inherited from

[`QueryOptions`](../../../core/src/interfaces/QueryOptions.md).[`offset`](../../../core/src/interfaces/QueryOptions.md#offset)

---

### range?

> `optional` **range**: [`Pagination`](../../../core/src/interfaces/Pagination.md)

Defined in: [packages/core/src/postgrest/types.ts:73](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L73)

#### Inherited from

[`QueryOptions`](../../../core/src/interfaces/QueryOptions.md).[`range`](../../../core/src/interfaces/QueryOptions.md#range)

---

### count?

> `optional` **count**: [`CountStrategy`](../../../core/src/type-aliases/CountStrategy.md)

Defined in: [packages/core/src/postgrest/types.ts:74](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L74)

#### Inherited from

[`QueryOptions`](../../../core/src/interfaces/QueryOptions.md).[`count`](../../../core/src/interfaces/QueryOptions.md#count)

---

### prefer?

> `optional` **prefer**: [`PreferenceOptions`](../../../core/src/interfaces/PreferenceOptions.md)

Defined in: [packages/core/src/postgrest/types.ts:78](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L78)

Preferences to include in the Prefer header

#### Inherited from

[`QueryOptions`](../../../core/src/interfaces/QueryOptions.md).[`prefer`](../../../core/src/interfaces/QueryOptions.md#prefer)

---

### fnName

> **fnName**: `string`

Defined in: [packages/tanstack/src/index.ts:20](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L20)

---

### args?

> `optional` **args**: `Record`\<`string`, `unknown`\>

Defined in: [packages/tanstack/src/index.ts:21](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L21)

---

### method?

> `optional` **method**: `"GET"` \| `"POST"`

Defined in: [packages/tanstack/src/index.ts:22](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L22)
