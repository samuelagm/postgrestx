[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [core/src](../README.md) / PostgrestError

# Class: PostgrestError

Defined in: [packages/core/src/postgrest/errors.ts:28](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/errors.ts#L28)

## Extends

- `Error`

## Constructors

### Constructor

> **new PostgrestError**(`payload`): `PostgrestError`

Defined in: [packages/core/src/postgrest/errors.ts:35](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/errors.ts#L35)

#### Parameters

##### payload

[`PostgrestErrorPayload`](../interfaces/PostgrestErrorPayload.md) & `object`

#### Returns

`PostgrestError`

#### Overrides

`Error.constructor`

## Properties

### code?

> `readonly` `optional` **code**: `string`

Defined in: [packages/core/src/postgrest/errors.ts:29](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/errors.ts#L29)

---

### details?

> `readonly` `optional` **details**: `unknown`

Defined in: [packages/core/src/postgrest/errors.ts:30](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/errors.ts#L30)

---

### hint?

> `readonly` `optional` **hint**: `unknown`

Defined in: [packages/core/src/postgrest/errors.ts:31](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/errors.ts#L31)

---

### status

> `readonly` **status**: `number`

Defined in: [packages/core/src/postgrest/errors.ts:32](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/errors.ts#L32)

---

### response?

> `readonly` `optional` **response**: [`HttpResponse`](../interfaces/HttpResponse.md)\<`unknown`\>

Defined in: [packages/core/src/postgrest/errors.ts:33](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/errors.ts#L33)
