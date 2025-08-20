# Testing @postgrestx/tanstack-query

This package includes React e2e tests that can run against a live PostgREST instance. By default, these tests are skipped unless the required environment variables are set.

## Run locally with the dev stack

1. Start the dev stack (from repo root):

```sh
docker compose -f infra/dev/docker-compose.yml up -d
```

2. Discover the mapped ports for PostgREST (app) and its admin server:

```sh
docker compose -f infra/dev/docker-compose.yml port postgrest 3000
docker compose -f infra/dev/docker-compose.yml port postgrest 3001
# Example output:
# 0.0.0.0:32782
# 0.0.0.0:32783
```

3. Export the URLs and run tests for this package:

```sh
export PGX_API_URL=http://localhost:<port-for-3000>
export PGX_ADMIN_URL=http://localhost:<port-for-3001>
pnpm --filter @postgrestx/tanstack-query test
```

4. When finished, stop the stack:

```sh
docker compose -f infra/dev/docker-compose.yml down -v
```

Notes:

- If `PGX_API_URL` and `PGX_ADMIN_URL` are not set, the e2e tests will be skipped automatically.
- The dev stack seeds three `people` rows; pagination tests expect an `infCount:3` result with `pageSize=2`.
