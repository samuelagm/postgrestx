[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [core/src](../README.md) / PostgrestClient

# Class: PostgrestClient

Defined in: [packages/core/src/postgrest/client.ts:46](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/client.ts#L46)

High-level PostgREST client exposing convenience CRUD + RPC helpers.

All helpers return a [QueryResult](../interfaces/QueryResult.md) which includes paging metadata parsed
from the `Content-Range` header when available.

Errors are normalized into [PostgrestError](PostgrestError.md) via [normalizeError](../functions/normalizeError.md).

## Examples

```ts
import { PostgrestClient, createFetchHttpClient } from '@postgrestx/core'
const http = createFetchHttpClient()
const client = new PostgrestClient('https://example.com', http)
```

```ts
const { data, total } = await client.select('users', {
  select: 'id,name',
  limit: 20,
})
```

```ts
const { data } = await client.select('users', {
  select: '*',
  filters: [{ column: 'status', op: 'eq', value: 'active' }],
  order: 'created_at.desc',
})
```

```ts
await client.insert(
  'users',
  { name: 'Ada' },
  { prefer: { return: 'representation' } },
)
```

```ts
const { data } = await client.rpc('search_users', { term: 'ada' })
```

## Constructors

### Constructor

> **new PostgrestClient**(`baseUrl`, `http`): `PostgrestClient`

Defined in: [packages/core/src/postgrest/client.ts:50](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/client.ts#L50)

#### Parameters

##### baseUrl

`string`

##### http

[`HttpClient`](../interfaces/HttpClient.md)

#### Returns

`PostgrestClient`

## Properties

### baseUrl

> `readonly` **baseUrl**: `string`

Defined in: [packages/core/src/postgrest/client.ts:47](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/client.ts#L47)

---

### http

> `readonly` **http**: [`HttpClient`](../interfaces/HttpClient.md)

Defined in: [packages/core/src/postgrest/client.ts:48](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/client.ts#L48)

## Methods

### select()

> **select**\<`T`\>(`resource`, `options?`): `Promise`\<[`QueryResult`](../interfaces/QueryResult.md)\<`T`\>\>

Defined in: [packages/core/src/postgrest/client.ts:60](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/client.ts#L60)

Perform a SELECT query against a table or view.

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### resource

`string`

Table or view name.

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

Query modifiers (filters/order/range/etc).

#### Returns

`Promise`\<[`QueryResult`](../interfaces/QueryResult.md)\<`T`\>\>

---

### insert()

> **insert**\<`T`\>(`resource`, `body`, `options?`): `Promise`\<[`QueryResult`](../interfaces/QueryResult.md)\<`T`\>\>

Defined in: [packages/core/src/postgrest/client.ts:72](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/client.ts#L72)

Insert row(s) into a table.
When `prefer.return` includes `representation` the inserted rows are returned.

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### resource

`string`

##### body

`unknown`

##### options?

[`WriteOptions`](../interfaces/WriteOptions.md)

#### Returns

`Promise`\<[`QueryResult`](../interfaces/QueryResult.md)\<`T`\>\>

---

### update()

> **update**\<`T`\>(`resource`, `body`, `options?`): `Promise`\<[`QueryResult`](../interfaces/QueryResult.md)\<`T`\>\>

Defined in: [packages/core/src/postgrest/client.ts:82](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/client.ts#L82)

Update row(s) using filters / range options provided.

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### resource

`string`

##### body

`unknown`

##### options?

[`WriteOptions`](../interfaces/WriteOptions.md)

#### Returns

`Promise`\<[`QueryResult`](../interfaces/QueryResult.md)\<`T`\>\>

---

### delete()

> **delete**\<`T`\>(`resource`, `options?`): `Promise`\<[`QueryResult`](../interfaces/QueryResult.md)\<`T`\>\>

Defined in: [packages/core/src/postgrest/client.ts:92](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/client.ts#L92)

Delete row(s) matching supplied filters

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### resource

`string`

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)

#### Returns

`Promise`\<[`QueryResult`](../interfaces/QueryResult.md)\<`T`\>\>

---

### upsert()

> **upsert**\<`T`\>(`resource`, `body`, `options?`): `Promise`\<[`QueryResult`](../interfaces/QueryResult.md)\<`T`\>\>

Defined in: [packages/core/src/postgrest/client.ts:102](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/client.ts#L102)

Upsert (insert or merge) row(s); defaults resolution to merge-duplicates unless overridden.

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### resource

`string`

##### body

`unknown`

##### options?

[`WriteOptions`](../interfaces/WriteOptions.md)

#### Returns

`Promise`\<[`QueryResult`](../interfaces/QueryResult.md)\<`T`\>\>

---

### rpc()

> **rpc**\<`T`\>(`fnName`, `args?`, `options?`): `Promise`\<[`QueryResult`](../interfaces/QueryResult.md)\<`T`\>\>

Defined in: [packages/core/src/postgrest/client.ts:112](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/client.ts#L112)

Call a PostgREST RPC function. GET when no args provided, otherwise POST.

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### fnName

`string`

##### args?

`Record`\<`string`, `unknown`\>

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md) & `object`

#### Returns

`Promise`\<[`QueryResult`](../interfaces/QueryResult.md)\<`T`\>\>
