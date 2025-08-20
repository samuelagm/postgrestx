import { describe, expect, it, vi } from 'vitest'
import { parseArgs, runGenerateTypes, main as cliMain } from '../bin/generate-types'
import { mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

describe('CLI: generate-types', () => {
    it('parseArgs parses --input and --out', () => {
        const args = parseArgs(['node', 'cli', '--input', 'a.json', '--out', 'outdir'])
        expect(args).toEqual({ input: 'a.json', out: 'outdir' })
    })

    it('parseArgs supports short flags -i and -o', () => {
        const args = parseArgs(['node', 'cli', '-i', 'a.json', '-o', 'outdir'])
        expect(args).toEqual({ input: 'a.json', out: 'outdir' })
    })

    it('parseArgs exits with code 1 when arguments missing', () => {
        const spy = vi
            .spyOn(process, 'exit')
            .mockImplementation(((code?: string | number | null) => { throw new Error(`exit:${code}`) }) as never)
        const err = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        expect(() => parseArgs(['node', 'cli'])).toThrow('exit:1')
        spy.mockRestore()
        err.mockRestore()
    })

    it('runGenerateTypes writes expected files', () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const here = dirname(fileURLToPath(import.meta.url))
        const input = resolve(here, '../../../openapi.sample.json')
        runGenerateTypes({ input, out })
        const tables = readFileSync(resolve(out, 'tables.d.ts'), 'utf8')
        const meta = JSON.parse(readFileSync(resolve(out, 'metadata.json'), 'utf8')) as { tables: { name: string }[] }
        expect(tables).toContain('export interface people')
        expect(meta.tables.map(t => t.name)).toContain('people')
    })

    it('main() runs end-to-end with provided argv (happy path)', async () => {
        const tmp = join(tmpdir(), `pgx-cli-${Math.random().toString(36).slice(2)}`)
        const out = join(tmp, 'out')
        mkdirSync(tmp, { recursive: true })
        const here = dirname(fileURLToPath(import.meta.url))
        const input = resolve(here, '../../../openapi.sample.json')
        const origArgv = process.argv
        process.argv = ['node', 'cli', '--input', input, '--out', out]
        await cliMain()
        const tables = readFileSync(resolve(out, 'tables.d.ts'), 'utf8')
        expect(tables).toContain('export interface people')
        process.argv = origArgv
    })

    it('main() exits on missing args (error path)', async () => {
        const origArgv = process.argv
        const spy = vi
            .spyOn(process, 'exit')
            .mockImplementation(((code?: string | number | null) => { throw new Error(`exit:${code}`) }) as never)
        const err = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        process.argv = ['node', 'cli']
        await expect(cliMain()).rejects.toThrow('exit:1')
        spy.mockRestore()
        err.mockRestore()
        process.argv = origArgv
    })
})
