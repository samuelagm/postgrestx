import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'bin/generate-types': 'bin/generate-types.ts',
  },
  format: ['esm', 'cjs'],
  dts: {
    entry: {
      index: 'src/index.ts',
    },
  },
  sourcemap: true,
  clean: true,
  shims: true,
  target: 'es2022',
})
