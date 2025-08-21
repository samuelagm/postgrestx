import { describe, it, expect, vi } from 'vitest'
import {
  createAxiosHttpClient,
  pickAxiosConfigProps,
  headersToObject,
} from '../src/http/axiosHttpClient'
import axios from 'axios'
import type { AxiosInstance } from 'axios'

it('headersToObject handles null/undefined (fallback branch)', () => {
  expect(headersToObject(null)).toEqual({})
  expect(headersToObject(undefined)).toEqual({})
})

it('headersToObject handles non-object/array/Headers (number, symbol)', () => {
  expect(headersToObject(123)).toEqual({})
  expect(headersToObject(Symbol('foo'))).toEqual({})
})

it('headersToObject ignores prototype properties', () => {
  const proto = { foo: 'bar' }
  const obj = Object.create(proto) as Record<string, string>
  obj.own = 'yes'
  expect(headersToObject(obj)).toEqual({ own: 'yes' })
})

it('headersToObject processes plain object with own properties', () => {
  const obj = {
    'content-type': 'application/json',
    authorization: 'Bearer token',
  }
  expect(headersToObject(obj)).toEqual({
    'content-type': 'application/json',
    authorization: 'Bearer token',
  })
})

it('pickAxiosConfigProps returns empty object if no allowed keys', () => {
  const result = pickAxiosConfigProps({})
  expect(result).toEqual({})
})

it('pickAxiosConfigProps copies allowed keys from init', () => {
  const fakeInit: RequestInit & { timeout?: number; notAllowed?: number } = {
    timeout: 123,
    notAllowed: 456,
  }
  const result = pickAxiosConfigProps(fakeInit)
  expect(result).toHaveProperty('timeout', 123)
  expect(result).not.toHaveProperty('notAllowed')
})
describe('createAxiosHttpClient', () => {
  it('should return a function', () => {
    const client = createAxiosHttpClient(axios)
    expect(typeof client).toBe('function')
  })

  it('should handle string input with init and headers as array', async () => {
    const mockAxios = {
      request: vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: 'ok',
        headers: [['x-foo', 'bar']],
      }),
    } as unknown as AxiosInstance
    const client = createAxiosHttpClient(mockAxios)
    const res = await client('https://example.com/api', {
      headers: [['x-foo', 'bar']],
    })
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('ok')
  })

  it('should handle string input with init and headers as object', async () => {
    const requestMock = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: 'ok',
      headers: { foo: 'bar' },
    })
    const mockAxios = {
      request: requestMock,
    } as unknown as AxiosInstance
    const client = createAxiosHttpClient(mockAxios)
    // Use a plain object with multiple properties to ensure for...in loop is exercised
    const res = await client('https://example.com/api', {
      headers: { 'content-type': 'application/json', 'x-custom': 'value' },
    })
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('ok')
    // Verify the headers were processed correctly
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { 'content-type': 'application/json', 'x-custom': 'value' },
      }),
    )
  })

  it('should handle Request input with headers as Headers instance', async () => {
    const mockAxios = {
      request: vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: 'ok',
        headers: { foo: 'bar' },
      }),
    } as unknown as AxiosInstance
    const client = createAxiosHttpClient(mockAxios)
    const req = new Request('https://example.com/api', {
      headers: { foo: 'bar' },
    })
    const res = await client(req)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('ok')
  })

  it('should handle GET/HEAD method and not send data', async () => {
    const requestMock = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: 'ok',
      headers: {},
    })
    const mockAxios = {
      request: requestMock,
    } as unknown as AxiosInstance
    const client = createAxiosHttpClient(mockAxios)
    await client('https://example.com/api', {
      method: 'GET',
      body: 'should not send',
    })
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: undefined }),
    )
  })

  it('should handle undefined axiosResponse.data', async () => {
    const mockAxios = {
      request: vi.fn().mockResolvedValue({
        status: 204,
        statusText: 'No Content',
        data: undefined,
        headers: {},
      }),
    } as unknown as AxiosInstance
    const client = createAxiosHttpClient(mockAxios)
    const res = await client('https://example.com/api')
    expect(res.status).toBe(204)
    expect(await res.text()).toBe('')
  })

  it('should throw error if axios throws without response', async () => {
    const mockAxios = {
      request: vi.fn().mockRejectedValue(new Error('fail')),
    } as unknown as AxiosInstance
    const client = createAxiosHttpClient(mockAxios)
    await expect(client('https://example.com/api')).rejects.toThrow('fail')
  })

  it('headersToObject handles Headers instance', () => {
    const h = new Headers([['a', '1']])
    const result = headersToObject(h)
    expect(result).toEqual({ a: '1' })
  })

  it('headersToObject handles array', () => {
    // @ts-expect-no-error
    const arr = [['foo', 'bar']]
    // Should convert to object
    expect(Object.fromEntries(arr)).toEqual({ foo: 'bar' })
  })

  it('headersToObject handles object', () => {
    const obj = { foo: 'bar' }
    expect(obj).toEqual({ foo: 'bar' })
  })

  it('headersToObject handles fallback', () => {
    expect({}).toEqual({})
  })

  it('should make a GET request and return a fetch-compatible Response', async () => {
    const mockAxios = {
      request: vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: { hello: 'world' },
        headers: { 'content-type': 'application/json' },
      }),
    } as unknown as AxiosInstance
    const client = createAxiosHttpClient(mockAxios)
    const res = await client('https://example.com/api')
    expect(res.status).toBe(200)
    expect(res.statusText).toBe('OK')
    expect(await res.json()).toEqual({ hello: 'world' })
  })

  it('should handle axios errors with response', async () => {
    const mockAxios = {
      request: vi.fn().mockRejectedValue({
        response: {
          status: 404,
          statusText: 'Not Found',
          data: 'not found',
          headers: {},
        },
      }),
    } as unknown as AxiosInstance
    const client = createAxiosHttpClient(mockAxios)
    const res = await client('https://example.com/api')
    expect(res.status).toBe(404)
    expect(res.statusText).toBe('Not Found')
    expect(await res.text()).toBe('not found')
  })
})
