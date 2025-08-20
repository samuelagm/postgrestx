import { describe, expect, it } from 'vitest'
import { loadSpec } from '../src/openapi/loadSpec'
import { introspectSpec } from '../src/openapi/schemaIntrospect'
import { emitOperatorsDTS, emitTablesDTS, toMetadataJSON } from '../src/openapi/tableMetadata'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const samplePath = path.resolve(here, '../../../openapi.sample.json')

describe('OpenAPI emitters', () => {
  it('emits tables.d.ts and metadata.json with expected content', () => {
    const spec = loadSpec(samplePath)
    const intro = introspectSpec(spec)

    const tables = emitTablesDTS(intro)
    expect(tables).toContain('export interface people')
    expect(tables).toContain('"id": number')
    expect(tables).toContain('"name"?: string')
    expect(tables).toContain('export interface tasks')

    const metadata = toMetadataJSON(intro)
    expect(metadata.tables.find(t => t.name === 'people')).toBeTruthy()
    expect(metadata.tables.find(t => t.name === 'people')?.primaryKey).toBe('id')
    expect(metadata.tables.find(t => t.name === 'people')?.columns.length).toBe(3)

    const ops = emitOperatorsDTS()
    expect(ops).toContain('export type StringOps')
    expect(ops).toContain('export type NumberOps')
  })
})
