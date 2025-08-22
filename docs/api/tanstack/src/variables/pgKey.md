[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / pgKey

# Variable: pgKey

> `const` **pgKey**: `object`

Defined in: [packages/tanstack/src/keys.ts:78](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/keys.ts#L78)

Factory which builds stable TanStack Query keys for PostgREST resources.

Key format:

- Table: `[ 'postgrest', 'table', resource, <params?> ]`
- RPC: `[ 'postgrest', 'rpc', fnName, <args?>, <params?> ]`

Undefined trailing segments are stripped for brevity. Internally stringifies
params with [stableStringify](../functions/stableStringify.md) so order of keys does not matter.

## Type declaration

### table()

> **table**(`resource`, `params?`): (`undefined` \| `string`)[]

Build a table/list key. Pass any shape for params (filters, pagination, etc).

#### Parameters

##### resource

`string`

##### params?

`unknown`

#### Returns

(`undefined` \| `string`)[]

#### Examples

```ts
pgKey.table('users')
// ['postgrest','table','users']
```

```ts
pgKey.table('users', {
  filters: [{ column: 'status', op: 'eq', value: 'active' }],
  limit: 20,
  offset: 40,
})
```

```ts
const a = pgKey.table('users', { b: 1, a: 2 })
const b = pgKey.table('users', { a: 2, b: 1 })
JSON.stringify(a) === JSON.stringify(b) // true
```

### rpc()

> **rpc**(`fnName`, `args?`, `params?`): (`undefined` \| `string`)[]

Build an RPC key containing function name + optionally args & metadata.

#### Parameters

##### fnName

`string`

##### args?

`unknown`

##### params?

`unknown`

#### Returns

(`undefined` \| `string`)[]

#### Examples

```ts
pgKey.rpc('health')
// ['postgrest','rpc','health']
```

```ts
pgKey.rpc('search_users', { term: 'ada' })
```

```ts
pgKey.rpc('search_users', { term: 'ada' }, { limit: 10 })
```
