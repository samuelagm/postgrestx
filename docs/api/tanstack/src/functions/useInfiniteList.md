[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / useInfiniteList

# Function: useInfiniteList()

> **useInfiniteList**\<`Table`\>(`tableName`, `params`, `options?`): `UseInfiniteQueryResult`\<\{ `items`: `Table`[]; `nextFrom?`: `number`; \}, `unknown`\>

Defined in: [packages/tanstack/src/index.ts:383](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L383)

Infinite scrolling list helper built on `useInfiniteQuery`.
Computes `nextFrom` based on total count / Content-Range.

## Type Parameters

### Table

`Table` = `unknown`

## Parameters

### tableName

`string`

### params

[`ListArgs`](../interfaces/ListArgs.md) & `object`

### options?

`UseInfiniteQueryOptions`\<\{ `items`: `Table`[]; `nextFrom?`: `number`; \}, `unknown`, \{ `items`: `Table`[]; `nextFrom?`: `number`; \}, readonly `unknown`[], `unknown`\>

## Returns

`UseInfiniteQueryResult`\<\{ `items`: `Table`[]; `nextFrom?`: `number`; \}, `unknown`\>

## Example

```ts
const products = useInfiniteList<Product>(
  'products',
  { pageSize: 50, select: 'id,name,price' },
  {
    getNextPageParam: (last) => last.nextFrom,
  },
)
```
