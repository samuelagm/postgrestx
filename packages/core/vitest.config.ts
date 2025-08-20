import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      reporter: ['text', 'lcov'],
      exclude: [
        'src/postgrest/types.ts', // type-only declarations
        'vitest.config.ts',
        'tsup.config.ts',
        'dist/**',
        'src/types/generated/**',
      ],
    },
    environment: 'node',
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
})
