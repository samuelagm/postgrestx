import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/*.config.*',
  'eslint.config.mjs',
  // Generated declaration files
  'packages/**/src/types/generated/**',
    ]
  },
  // Global, non-type-aware linting for all files by default
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // Apply type-aware rules only to source and test files
  {
    files: ['packages/**/src/**/*.ts', 'packages/**/test/**/*.ts'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Relax strict-typed rules in OpenAPI introspection sources, which legitimately
  // traverse unknown JSON structures from third-party specs.
  {
    files: ['packages/**/src/openapi/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  // E2E tests can include empty catch blocks for polling/retries
  {
    files: ['packages/**/test-e2e/**/*.ts'],
    rules: {
      'no-empty': 'off',
    },
  },
  // Ensure bin scripts stay on non-typed rules to avoid requiring project config
  {
    files: ['packages/**/bin/**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
  }
)
