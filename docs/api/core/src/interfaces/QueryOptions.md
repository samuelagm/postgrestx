[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [core/src](../README.md) / QueryOptions

# Interface: QueryOptions

Defined in: [packages/core/src/postgrest/types.ts:67](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L67)

## Extended by

- [`WriteOptions`](WriteOptions.md)

## Properties

### select?

> `optional` **select**: `string`

Defined in: [packages/core/src/postgrest/types.ts:68](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L68)

---

### filters?

> `optional` **filters**: [`Filter`](Filter.md)[]

Defined in: [packages/core/src/postgrest/types.ts:69](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L69)

---

### order?

> `optional` **order**: `string` \| `string`[]

Defined in: [packages/core/src/postgrest/types.ts:70](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L70)

---

### limit?

> `optional` **limit**: `number`

Defined in: [packages/core/src/postgrest/types.ts:71](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L71)

---

### offset?

> `optional` **offset**: `number`

Defined in: [packages/core/src/postgrest/types.ts:72](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L72)

---

### range?

> `optional` **range**: [`Pagination`](Pagination.md)

Defined in: [packages/core/src/postgrest/types.ts:73](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L73)

---

### count?

> `optional` **count**: [`CountStrategy`](../type-aliases/CountStrategy.md)

Defined in: [packages/core/src/postgrest/types.ts:74](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L74)

---

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/core/src/postgrest/types.ts:76](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L76)

Additional headers to send with the request

---

### prefer?

> `optional` **prefer**: [`PreferenceOptions`](PreferenceOptions.md)

Defined in: [packages/core/src/postgrest/types.ts:78](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/types.ts#L78)

Preferences to include in the Prefer header
