# Phase 6 — Docker, Testing, and CI/CD

## Docker

### Dockerfile — Multi-Stage Build

The `Dockerfile` uses three stages:

| Stage     | Base             | Purpose                                                   |
| --------- | ---------------- | --------------------------------------------------------- |
| `base`    | `node:24-alpine` | Enable corepack, install pnpm 11.13.1                     |
| `deps`    | `base`           | `pnpm install --frozen-lockfile --ignore-scripts`         |
| `builder` | `deps`           | Copy source, run `prisma generate` and `pnpm build`       |
| `runner`  | `node:24-alpine` | Copy `node_modules`, `dist/`, and `prisma/` — final image |

The final image is `node:24-alpine`, sets `NODE_ENV=production`, exposes port `5000`, and runs `pnpm start:prod`.

Husky is disabled in the build environment (`ENV HUSKY=0`).

### Docker Compose

The included `compose.yml` starts three services:

| Service | Image                   | Port        | Notes                                                                                    |
| ------- | ----------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| `app`   | Built from `Dockerfile` | `5000:5000` | Reads `.env.docker`; waits for `db` and `redis` health checks                            |
| `db`    | `postgres:17-alpine`    | (internal)  | Data volume: `raco-ai-job-task-db-data`                                                  |
| `redis` | `redis:7-alpine`        | (internal)  | AOF persistence enabled (`--appendonly yes`); data volume: `raco-ai-job-task-redis-data` |

Health checks are configured for both `db` and `redis` with `pg_isready` and `redis-cli ping` respectively. The `app` service will not start until both pass.

### Running with Docker Compose

**1. Create the Docker environment file:**

```bash
# Linux / macOS
cp .env.example .env.docker

# Windows PowerShell
Copy-Item .env.example .env.docker
```

**2. Configure internal service hostnames in `.env.docker`:**

```env
DATABASE_URL=postgresql://user:password@db:5432/order-flow
REDIS_URL=redis://redis:6379
SERVER_URL=http://localhost:5000
```

Use the Compose service names (`db`, `redis`) as hostnames for internal connections. All other environment variables must also be filled in.

**3. Build and start the stack:**

```bash
docker compose up --build
```

**4. Apply migrations (required — not automatic):**

```bash
docker compose exec app pnpm prisma migrate deploy
```

**5. Seed demo data (optional):**

```bash
docker compose exec app pnpm prisma db seed
```

**6. Access the API:**

- API: `http://localhost:5000/api/v1`
- Swagger: `http://localhost:5000/api/docs`
- Bull Board (if `SHOW_BULL_BOARD=true`): `http://localhost:5000/queues`

**7. View logs:**

```bash
docker compose logs -f app
```

**8. Stop the stack:**

```bash
# Stop containers, preserve volumes
docker compose down

# Stop containers and remove volumes (deletes all DB and Redis data)
docker compose down -v
```

### Notes and Known Limitations

- Migrations do not run automatically on container start. Run `docker compose exec app pnpm prisma migrate deploy` manually after the first `up`.
- The Docker Compose container names use a `raco-ai-job-task` prefix (a remnant from an earlier project name). This does not affect functionality but may look unexpected in `docker ps` output.
- The Dockerfile installs pnpm `11.13.1` while `package.json` specifies `packageManager: pnpm@12.4.2`. They are separately controlled; no functional mismatch was observed, but aligning them would be cleaner.

---

## Testing

### Unit Tests

Jest is configured in `package.json` targeting `src/**/*.spec.ts`.

```bash
pnpm test
pnpm test:cov # with coverage report
```

**What exists:** Two spec files in `src/modules/product-review-summary/` — `product-review-summary.service.spec.ts` and `product-review-summary.controller.spec.ts`.

No other spec files were found in the repository. The `pnpm test` command will succeed but has minimal coverage. The `pnpm test:e2e` command references `./test/jest-e2e.json` which does not exist in the repository.

### Quality Checks

| Tool        | Command         | Purpose                                                             |
| ----------- | --------------- | ------------------------------------------------------------------- |
| ESLint      | `pnpm lint`     | Static analysis with plugins for NestJS, security, unicorn, sonarjs |
| ESLint fix  | `pnpm lint:fix` | Auto-fix where possible                                             |
| Prettier    | `pnpm format`   | Code formatting                                                     |
| Husky       | (pre-commit)    | Runs lint-staged on staged files                                    |
| lint-staged | (pre-commit)    | Runs ESLint and Prettier on changed files                           |

The ESLint config (`eslint.config.mjs`) uses plugins: `@typescript-eslint`, `@darraghor/eslint-plugin-nestjs-typed`, `eslint-plugin-security`, `eslint-plugin-sonarjs`, `eslint-plugin-unicorn`, `eslint-plugin-import`, `eslint-plugin-perfectionist`, `eslint-plugin-n`.

---

## CI/CD

### Workflow 1: CI/CD — Build, Push and Deploy (`build-push.yml`)

**Trigger:** Push to `main`; pull requests targeting `main`.

**Jobs:**

```
build (always):
  - checkout
  - setup pnpm 12.4.2
  - setup Node.js 24
  - pnpm install --frozen-lockfile
  - pnpm build
  - pnpm lint

docker (push to main only, after build passes):
  - checkout
  - docker login (DOCKERHUB_USERNAME / DOCKERHUB_TOKEN secrets)
  - docker/setup-buildx-action
  - docker metadata: tags = latest + short SHA
  - docker build-push (cache: GitHub Actions cache)
  - curl Render deploy hook (RENDER_DEPLOY_HOOK_URL secret)
```

Concurrent runs are cancelled with `concurrency.cancel-in-progress: true`.

The Docker image is pushed to `<DOCKERHUB_USERNAME>/order-flow` with two tags: `latest` and the short commit SHA.

**Note:** The CI pipeline does not run tests. Only build and lint are verified.

### Workflow 2: Neon DB Migration (`db-migration.yml`)

**Trigger:** Push to `main` when any of these paths change:

- `prisma/migrations/**`
- `prisma/schema.prisma`
- `prisma.config.ts`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`

Also supports manual trigger (`workflow_dispatch`).

**Job:**

```
migrate:
  - checkout
  - setup pnpm 11.13.1
  - setup Node.js 24
  - pnpm install --frozen-lockfile --ignore-scripts
  - pnpm prisma migrate deploy (DATABASE_URL from secrets)
```

This workflow applies production migrations to the Neon hosted database. It does not run on pull requests.

Concurrent runs are not cancelled (`cancel-in-progress: false`) to ensure migrations are not interrupted.

### Badges

The following badges accurately reflect these workflows:

```markdown
[![CI/CD — Build, Push & Deploy](https://github.com/habib33-3/order-flow/actions/workflows/build-push.yml/badge.svg)](https://github.com/habib33-3/order-flow/actions/workflows/build-push.yml)
[![Neon DB Migration](https://github.com/habib33-3/order-flow/actions/workflows/db-migration.yml/badge.svg)](https://github.com/habib33-3/order-flow/actions/workflows/db-migration.yml)
```

No test coverage badge — CI does not produce coverage reports.
