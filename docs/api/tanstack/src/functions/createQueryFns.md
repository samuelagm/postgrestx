[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / createQueryFns

# Function: createQueryFns()

> **createQueryFns**(`client`): `object`

Defined in: [packages/tanstack/src/index.ts:52](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L52)

Factory producing basic query functions suitable for use with TanStack Query's `queryFn`.

When / Why:

- Need to compose additional behaviors (retry, staleTime) without wrapping our provided hooks.
- Building domain-specific hooks (e.g. `useActiveUsers`) while centralizing selection & encoding.
- Sharing a single `PostgrestClient` across many query functions without recreating closures each render.

## Parameters

### client

[`PostgrestClient`](../../../core/src/classes/PostgrestClient.md)

## Returns

`object`

### select()

> **select**\<`T`\>(`__namedParameters`): () => `Promise`\<`T`\>

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### \_\_namedParameters

[`TableQueryParams`](../interfaces/TableQueryParams.md)

#### Returns

> (): `Promise`\<`T`\>

##### Returns

`Promise`\<`T`\>

### rpc()

> **rpc**\<`T`\>(`__namedParameters`): () => `Promise`\<`T`\>

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### \_\_namedParameters

[`RpcQueryParams`](../interfaces/RpcQueryParams.md)

#### Returns

> (): `Promise`\<`T`\>

##### Returns

`Promise`\<`T`\>

## Examples

```ts
const fns = createQueryFns(client)
const usersQuery = useQuery({
  queryKey: pgKey.table('users', { select: 'id,name' }),
  queryFn: fns.select<User>({ resource: 'users', select: 'id,name' }),
})
```

```ts
function useSearch(term: string) {
  const fns = React.useMemo(() => createQueryFns(client), [client])
  return useQuery({
    queryKey: pgKey.rpc('search_users', { term }),
    queryFn: fns.rpc<User[]>({ fnName: 'search_users', args: { term } }),
  })
}
```
