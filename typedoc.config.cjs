/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
    entryPoints: [
        'packages/core/src/index.ts',
        'packages/tanstack/src/index.ts'
    ],
    entryPointStrategy: 'resolve',
    tsconfig: 'tsconfig.base.json',
    plugin: ['typedoc-plugin-markdown'],
    out: 'docs/api',
    readme: 'none',
    categorizeByGroup: true,
    sort: ['source-order'],
    excludeExternals: true,
    excludePrivate: true,
    excludeProtected: true,
    githubPages: false,
    hideGenerator: true,
    includeVersion: true,
}
