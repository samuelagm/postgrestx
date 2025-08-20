import { describe, expect, it } from 'vitest'
import { introspectSpec } from '../src/openapi/schemaIntrospect'
import type { AnySpec } from '../src/openapi/loadSpec'

describe('schemaIntrospect additional branches', () => {
    it('supports Swagger v2 definitions', () => {
        const spec: AnySpec = {
            swagger: '2.0',
            definitions: {
                thing: {
                    type: 'object',
                    required: ['id'],
                    properties: { id: { type: 'integer' }, name: { type: 'string' } },
                },
            },
        }
        const intro = introspectSpec(spec)
        expect(intro.tables.find(t => t.name === 'thing')?.primaryKey).toBe('id')
    })

    it('resolveType returns unknown for falsy property', () => {
        const spec: AnySpec = {
            openapi: '3.0.0',
            components: { schemas: { t: { type: 'object', properties: { n: undefined } } } },
        }
        const intro = introspectSpec(spec)
        const t = intro.tables.find(x => x.name === 't')!
        expect(t.columns.find(c => c.name === 'n')?.type).toBe('unknown')
    })

    it('skips non-object schemas', () => {
        const spec: AnySpec = {
            openapi: '3.0.0',
            components: { schemas: { s: 'not an object' as unknown as object } },
        }
        const intro = introspectSpec(spec)
        expect(intro.tables.find(t => t.name === 's')).toBeUndefined()
    })

    it('handles empty spec without definitions or components', () => {
        const intro = introspectSpec({} as AnySpec)
        expect(intro.tables.length).toBe(0)
    })
})
