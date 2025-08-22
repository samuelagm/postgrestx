[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / createMutationFns

# Function: createMutationFns()

> **createMutationFns**(`client`): `object`

Defined in: [packages/tanstack/src/index.ts:120](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/index.ts#L120)

Factory for building reusable mutation functions wrapping PostgREST operations.

When / Why:

- Centralize mutation options (e.g. always request representation, logging).
- Build domain-level abstractions (e.g. `mutations.insertUser`).
- Avoid recreating inline mutation functions inside components.

## Parameters

### client

[`PostgrestClient`](../../../core/src/classes/PostgrestClient.md)

## Returns

`object`

### insert()

> **insert**\<`T`\>(`resource`, `options?`): (`body`) => `Promise`\<`T`\>

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### resource

`string`

##### options?

[`WriteOptions`](../../../core/src/interfaces/WriteOptions.md)

#### Returns

> (`body`): `Promise`\<`T`\>

##### Parameters

###### body

`unknown`

##### Returns

`Promise`\<`T`\>

### update()

> **update**\<`T`\>(`resource`, `options?`): (`body`) => `Promise`\<`T`\>

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### resource

`string`

##### options?

[`WriteOptions`](../../../core/src/interfaces/WriteOptions.md)

#### Returns

> (`body`): `Promise`\<`T`\>

##### Parameters

###### body

`unknown`

##### Returns

`Promise`\<`T`\>

### upsert()

> **upsert**\<`T`\>(`resource`, `options?`): (`body`) => `Promise`\<`T`\>

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### resource

`string`

##### options?

[`WriteOptions`](../../../core/src/interfaces/WriteOptions.md)

#### Returns

> (`body`): `Promise`\<`T`\>

##### Parameters

###### body

`unknown`

##### Returns

`Promise`\<`T`\>

### delete()

> **delete**\<`T`\>(`resource`, `options?`): () => `Promise`\<`T`\>

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### resource

`string`

##### options?

[`QueryOptions`](../../../core/src/interfaces/QueryOptions.md)

#### Returns

> (): `Promise`\<`T`\>

##### Returns

`Promise`\<`T`\>

### rpc()

> **rpc**\<`T`\>(`fnName`, `args?`, `options?`): () => `Promise`\<`T`\>

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### fnName

`string`

##### args?

`Record`\<`string`, `unknown`\>

##### options?

[`QueryOptions`](../../../core/src/interfaces/QueryOptions.md) & `object`

#### Returns

> (): `Promise`\<`T`\>

##### Returns

`Promise`\<`T`\>

## Example

```ts
const { insert } = createMutationFns(client)
const addUser = useMutation({ mutationFn: insert<User>('users') })
```
