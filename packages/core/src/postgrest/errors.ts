/**
 * Error normalization for PostgREST responses.
 *
 * Converts raw HTTP responses into {@link PostgrestError} capturing common
 * PostgREST fields like `code`, `message`, `details`, and `hint`.
 *
 * @example Handling errors
 * ```ts
 * try {
 *   await client.insert('users', { name: 'Ada' })
 * } catch (e) {
 *   if (e instanceof PostgrestError) {
 *     console.error(e.code, e.message)
 *   }
 * }
 * ```
 */

import type { HttpResponse } from './http'

export interface PostgrestErrorPayload {
  code?: string
  message?: string
  details?: unknown
  hint?: unknown
}

export class PostgrestError extends Error {
  readonly code?: string
  readonly details?: unknown
  readonly hint?: unknown
  readonly status: number
  readonly response?: HttpResponse<unknown>

  constructor(
    payload: PostgrestErrorPayload & {
      status: number
      response?: HttpResponse<unknown>
    },
  ) {
    super(payload.message ?? 'PostgREST error')
    this.name = 'PostgrestError'
    this.code = payload.code
    this.details = payload.details
    this.hint = payload.hint
    this.status = payload.status
    this.response = payload.response
  }
}

export function normalizeError(res: HttpResponse<unknown>): PostgrestError {
  const status = res.status
  const body = res.data

  // Common PostgREST error shape
  const fromBody = ((): PostgrestErrorPayload => {
    if (body && typeof body === 'object') {
      const b = body as Record<string, unknown>
      const message =
        typeof b.message === 'string'
          ? b.message
          : typeof b.error === 'string'
            ? b.error
            : undefined
      const code = typeof b.code === 'string' ? b.code : undefined
      const details = b.details
      const hint = b.hint
      return { code, message, details, hint }
    }
    if (typeof body === 'string') {
      return { message: body }
    }
    return {}
  })()

  return new PostgrestError({ status, response: res, ...fromBody })
}
