import { describe, expect, it } from 'vitest'
import { normalizeError } from '../src/postgrest/errors'

describe('errors additional branches', () => {
    it('normalizeError handles object body without message or error', () => {
        const err = normalizeError({ status: 418, headers: {}, data: { foo: 'bar' } })
        expect(err).toMatchObject({ status: 418, message: 'PostgREST error' })
    })
})
