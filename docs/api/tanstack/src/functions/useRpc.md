[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / useRpc

# Function: useRpc()

> **useRpc**\<`RpcReturn`, `RpcArgs`\>(`functionName`, `options?`): `UseMutationResult`\<`RpcReturn`, `unknown`, `RpcArgs`, `unknown`\>

Defined in: [packages/tanstack/src/index.ts:361](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L361)

Execute a PostgREST RPC function as a mutation.

## Type Parameters

### RpcReturn

`RpcReturn` = `unknown`

### RpcArgs

`RpcArgs` _extends_ `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Parameters

### functionName

`string`

### options?

`UseMutationOptions`\<`RpcReturn`, `unknown`, `RpcArgs`, `unknown`\>

## Returns

`UseMutationResult`\<`RpcReturn`, `unknown`, `RpcArgs`, `unknown`\>

## Example

```ts
const runSearch = useRpc<{ id: number }[], { term: string }>('search_users')
runSearch.mutate({ term: 'ada' })
```
