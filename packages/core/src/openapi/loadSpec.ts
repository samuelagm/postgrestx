/**
 * Load an OpenAPI (Swagger v2 or OpenAPI v3) JSON file from disk.
 */
import { readFileSync } from 'node:fs'

export type AnySpec = Record<string, any>

export function loadSpec(path: string): AnySpec {
  const raw = readFileSync(path, 'utf8')
  try {
    return JSON.parse(raw)
  } catch (e) {
    throw new Error(`Failed to parse OpenAPI JSON at ${path}: ${(e as Error).message}`)
  }
}
