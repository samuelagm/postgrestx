# Git Hooks Setup

This project uses [Husky](https://typicode.github.io/husky/) for git hooks to maintain code quality and consistency.

## Pre-commit Hook

Runs automatically before each commit:

- **Lint & Format**: Uses `lint-staged` to run ESLint and Prettier on staged files
- **Auto-fix**: Automatically fixes linting issues and formats code
- **Type checking**: Ensures TypeScript compiles without errors

If any issues can't be auto-fixed, the commit will be blocked until manually resolved.

## Pre-push Hook

Runs automatically before each push:

- **Tests**: Runs all test suites to ensure nothing is broken
- **Build**: Compiles all packages to catch build errors
- **Coverage**: Validates test coverage requirements

## Commit Message Hook

Enforces [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat: add new feature`
- `fix: resolve bug in authentication`
- `docs: update API documentation`
- `style: fix formatting issues`
- `refactor: restructure components`
- `test: add unit tests for utils`
- `chore: update dependencies`
- `ci: update GitHub Actions workflow`
- `perf: optimize query performance`
- `build: update build configuration`
- `revert: revert previous changes`

With optional scope: `feat(core): add new API endpoint`

## Setup

The hooks are automatically installed when running:

```bash
pnpm install
```

## Manual Hook Management

To reinstall hooks:

```bash
pnpm run prepare
```

To bypass hooks (not recommended):

```bash
git commit --no-verify -m "emergency fix"
git push --no-verify
```

## Configuration

- **lint-staged**: Configured in `package.json`
- **Husky hooks**: Located in `.husky/` directory
- **ESLint**: Configured in `eslint.config.mjs`
- **Prettier**: Configured in `package.json`
