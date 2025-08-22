[**postgrestx-monorepo v0.0.1**](../../../README.md)

---

[postgrestx-monorepo](../../../README.md) / [tanstack/src](../README.md) / createAxiosHttpClient

# Function: createAxiosHttpClient()

> **createAxiosHttpClient**(`axios`): (`input`, `init?`) => `Promise`\<`Response`\>

Defined in: [packages/tanstack/src/http/axiosHttpClient.ts:7](https://github.com/samuelagm/postgrestx/blob/7b606dc406c6da40c0579c7268eb7cd998b69db8/packages/tanstack/src/http/axiosHttpClient.ts#L7)

Creates a fetch-compatible HTTP client using Axios.
This allows you to use Axios anywhere a fetch-like client is expected.

## Parameters

### axios

`AxiosInstance`

## Returns

> (`input`, `init?`): `Promise`\<`Response`\>

### Parameters

#### input

`string` | `Request`

#### init?

`RequestInit`

### Returns

`Promise`\<`Response`\>
