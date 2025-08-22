import { promises as fs } from 'fs'
import path from 'path'

const apiRoot = path.resolve('docs/api')

async function ensureIndex(dir) {
    const readme = path.join(dir, 'README.md')
    const index = path.join(dir, 'index.md')
    try {
        await fs.access(readme)
    } catch {
        return
    }
    try {
        await fs.access(index)
    } catch {
        const content = await fs.readFile(readme, 'utf8')
        await fs.writeFile(index, content, 'utf8')
    }
}

async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    await ensureIndex(dir)
    for (const e of entries) {
        if (e.isDirectory()) {
            await walk(path.join(dir, e.name))
        }
    }
}

; (async () => {
    await walk(apiRoot)
})().catch(err => {
    console.error('[postprocess-typedoc] failed', err)
    process.exit(1)
})
