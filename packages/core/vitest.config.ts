import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      reporter: ['text', 'lcov'],
    },
    environment: 'node',
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
})
