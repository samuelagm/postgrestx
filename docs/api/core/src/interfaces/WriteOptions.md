[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [core/src](../README.md) / WriteOptions

# Interface: WriteOptions

Defined in: [packages/core/src/postgrest/types.ts:107](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L107)

## Extends

- [`QueryOptions`](QueryOptions.md)

## Properties

### select?

> `optional` **select**: `string`

Defined in: [packages/core/src/postgrest/types.ts:68](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L68)

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`select`](QueryOptions.md#select)

---

### filters?

> `optional` **filters**: [`Filter`](Filter.md)[]

Defined in: [packages/core/src/postgrest/types.ts:69](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L69)

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`filters`](QueryOptions.md#filters)

---

### order?

> `optional` **order**: `string` \| `string`[]

Defined in: [packages/core/src/postgrest/types.ts:70](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L70)

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`order`](QueryOptions.md#order)

---

### limit?

> `optional` **limit**: `number`

Defined in: [packages/core/src/postgrest/types.ts:71](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L71)

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`limit`](QueryOptions.md#limit)

---

### offset?

> `optional` **offset**: `number`

Defined in: [packages/core/src/postgrest/types.ts:72](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L72)

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`offset`](QueryOptions.md#offset)

---

### range?

> `optional` **range**: [`Pagination`](Pagination.md)

Defined in: [packages/core/src/postgrest/types.ts:73](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L73)

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`range`](QueryOptions.md#range)

---

### count?

> `optional` **count**: [`CountStrategy`](../type-aliases/CountStrategy.md)

Defined in: [packages/core/src/postgrest/types.ts:74](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L74)

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`count`](QueryOptions.md#count)

---

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/core/src/postgrest/types.ts:76](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L76)

Additional headers to send with the request

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`headers`](QueryOptions.md#headers)

---

### prefer?

> `optional` **prefer**: [`PreferenceOptions`](PreferenceOptions.md)

Defined in: [packages/core/src/postgrest/types.ts:78](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L78)

Preferences to include in the Prefer header

#### Inherited from

[`QueryOptions`](QueryOptions.md).[`prefer`](QueryOptions.md#prefer)

---

### columns?

> `optional` **columns**: `string`

Defined in: [packages/core/src/postgrest/types.ts:109](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L109)

Limit inserted keys to these columns

---

### on_conflict?

> `optional` **on_conflict**: `string`

Defined in: [packages/core/src/postgrest/types.ts:111](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L111)

Upsert conflict target, e.g., "name" or a composite key "(col1,col2)"
