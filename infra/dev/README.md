# Dev environment (Docker)

Spin up Postgres + PostgREST for local development and type generation.

## Start

```bash
# from repo root
docker compose -f infra/dev/docker-compose.yml up -d --wait
```

- Postgres: localhost:5432 (user: postgres / pass: postgres / db: app)
- PostgREST: http://localhost:3000/

## Fetch OpenAPI JSON

```bash
curl -s http://localhost:3000/ > openapi.json
```

You can now run the generator to produce types:

```bash
pnpm -w build
pnpm --filter @postgrestx/core exec node ./dist/bin/generate-types.cjs --input ../../openapi.json --out ./src/types/generated
```

## Tear down

```bash
docker compose -f infra/dev/docker-compose.yml down -v
```
