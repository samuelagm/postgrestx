[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / createInfiniteQueryFns

# Function: createInfiniteQueryFns()

> **createInfiniteQueryFns**(`client`): `object`

Defined in: [packages/tanstack/src/index.ts:88](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L88)

Factory for building infinite query functions based on a page size.
Handles `Content-Range` parsing and next page calculation.

When / Why:

- Need infinite list but want custom composition (e.g. dynamic pageSize, merging pages differently).
- Building specialized infinite hooks that pre-fill filters.

## Parameters

### client

[`PostgrestClient`](../../../core/src/classes/PostgrestClient.md)

## Returns

`object`

### select()

> **select**\<`T`\>(`params`): (`__namedParameters`) => `Promise`\<\{ `items`: `T`; `nextFrom?`: `number`; \}\>

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### params

[`TableQueryParams`](../interfaces/TableQueryParams.md) & `object`

#### Returns

> (`__namedParameters`): `Promise`\<\{ `items`: `T`; `nextFrom?`: `number`; \}\>

##### Parameters

###### \_\_namedParameters

##### Returns

`Promise`\<\{ `items`: `T`; `nextFrom?`: `number`; \}\>

## Example

```ts
const fns = createInfiniteQueryFns(client)
const products = useInfiniteQuery({
  queryKey: pgKey.table('products', { pageSize: 25 }),
  queryFn: fns.select<Product>({
    resource: 'products',
    pageSize: 25,
    select: 'id,name,price',
  }),
  initialPageParam: 0,
  getNextPageParam: (last) => last.nextFrom,
})
```
