import { describe, expect, it } from 'vitest'
import { loadSpec } from '../src/openapi/loadSpec'
import type { AnySpec } from '../src/openapi/loadSpec'
import { introspectSpec } from '../src/openapi/schemaIntrospect'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const samplePath = path.resolve(here, '../../../openapi.sample.json')

describe('OpenAPI introspection', () => {
  it('introspects tables and primary keys from sample spec', () => {
    const spec = loadSpec(samplePath)
    const intro = introspectSpec(spec)

    expect(intro.tables.length).toBe(2)

    const people = intro.tables.find(t => t.name === 'people')
    expect(people).toBeTruthy()
    expect(people?.primaryKey).toBe('id')
    expect(people?.columns.map(c => c.name)).toEqual(['id', 'name', 'age'])
    const peopleId = people?.columns.find(c => c.name === 'id')
    const peopleName = people?.columns.find(c => c.name === 'name')
    expect(peopleId?.type).toBe('number')
    expect(peopleId?.required).toBe(true)
    expect(peopleName?.required).toBe(false)

    const tasks = intro.tables.find(t => t.name === 'tasks')
    expect(tasks).toBeTruthy()
    expect(tasks?.primaryKey).toBeUndefined()
    const done = tasks?.columns.find(c => c.name === 'done')
    expect(done?.type).toBe('boolean')
  })

  it('supports OpenAPI v3 components and various type resolutions', () => {
    const spec: AnySpec = {
      openapi: '3.1.0',
      components: {
        schemas: {
          refType: { type: 'string' },
          // should be skipped (non-object)
          nonObject: { type: 'string' },
          // should be skipped (empty properties)
          emptyObj: { type: 'object', properties: {} },
          thing: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { $ref: '#/components/schemas/refType' },
              arr: { type: 'array', items: { type: 'integer' } },
              date: { type: 'string', format: 'date-time' },
              unknown: {},
            },
          },
          other: {
            type: 'object',
            properties: { obj: { type: 'object' } },
          },
        },
      },
  }

  const intro = introspectSpec(spec)
    const thing = intro.tables.find(t => t.name === 'thing')
    expect(thing).toBeTruthy()
    expect(thing?.primaryKey).toBe('id')
    const id = thing?.columns.find(c => c.name === 'id')
    const arr = thing?.columns.find(c => c.name === 'arr')
    const date = thing?.columns.find(c => c.name === 'date')
    const unk = thing?.columns.find(c => c.name === 'unknown')
    expect(id?.type).toBe('refType')
    expect(arr?.type).toBe('number[]')
    expect(date?.type).toBe('string')
    expect(unk?.type).toBe('any')

  const other = intro.tables.find(t => t.name === 'other')
  const obj = other?.columns.find(c => c.name === 'obj')
    expect(obj?.type).toBe('Record<string, any>')
  })
})
