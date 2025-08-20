import { describe, expect, it } from 'vitest'
import { loadSpec } from '../src/openapi/loadSpec'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

describe('loadSpec', () => {
  it('throws a helpful error on invalid JSON', () => {
    const p = path.join(tmpdir(), `bad-openapi-${Date.now()}.json`)
    writeFileSync(p, '{ not: valid }', 'utf8')
    try {
      expect(() => loadSpec(p)).toThrow(/Failed to parse OpenAPI JSON/)
    } finally {
      unlinkSync(p)
    }
  })
})
