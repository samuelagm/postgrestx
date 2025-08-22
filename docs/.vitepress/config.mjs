import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'PostgRESTX',
    description: 'TypeScript SDK & React adapters for PostgREST',
    lang: 'en-US',
    base: '/postgrestx/', // GitHub Pages repo name
    head: [
        ['meta', { name: 'theme-color', content: '#0d1117' }],
        ['link', { rel: 'icon', type: 'image/svg+xml', href: '/postgrestx/favicon.svg' }],
    ],
    themeConfig: {
        nav: [
            { text: 'Guide', link: '/getting-started' },
            { text: 'Packages', link: '/packages' },
            { text: 'API', link: '/api/' }
        ],
        sidebar: {
            '/': [
                {
                    text: 'Introduction',
                    items: [
                        { text: 'Why PostgRESTX', link: '/' },
                        { text: 'Getting Started', link: '/getting-started' },
                        { text: 'Packages', link: '/packages' }
                    ]
                },
                {
                    text: 'Usage',
                    items: [
                        { text: 'Core Client', link: '/core' },
                        { text: 'React + TanStack', link: '/tanstack' }
                    ]
                },
                {
                    text: 'API Reference',
                    items: [
                        { text: 'Overview', link: '/api/' },
                        { text: 'Core Module', link: '/api/core/src/README' },
                        { text: 'TanStack Module', link: '/api/tanstack/src/README' },
                    ]
                }
            ]
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/samuelagm/postgrestx' }
        ],
        search: { provider: 'local' }
    }
})
