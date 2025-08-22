[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [core/src](../README.md) / HttpRequest

# Interface: HttpRequest

Defined in: [packages/core/src/postgrest/http.ts:8](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/http.ts#L8)

Minimal HTTP client interface abstraction used by [PostgrestClient](../classes/PostgrestClient.md).

Implementations only need to provide a `request` method. A small fetch-based
implementation is provided via [createFetchHttpClient](../functions/createFetchHttpClient.md).

## Properties

### method

> **method**: `"GET"` \| `"POST"` \| `"PATCH"` \| `"DELETE"` \| `"PUT"` \| `"HEAD"`

Defined in: [packages/core/src/postgrest/http.ts:9](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/http.ts#L9)

---

### url

> **url**: `string`

Defined in: [packages/core/src/postgrest/http.ts:10](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/http.ts#L10)

---

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/core/src/postgrest/http.ts:11](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/http.ts#L11)

---

### body?

> `optional` **body**: `unknown`

Defined in: [packages/core/src/postgrest/http.ts:12](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/core/src/postgrest/http.ts#L12)
