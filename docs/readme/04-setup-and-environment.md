# Phase 5 — Setup and Environment

## Prerequisites

| Requirement | Minimum Version | Notes                                  |
| ----------- | --------------- | -------------------------------------- |
| Node.js     | 24              | LTS; matches Dockerfile base image     |
| pnpm        | 12              | `packageManager` field in package.json |
| PostgreSQL  | 17              | Or Docker (see Docker section)         |
| Redis       | 7               | Or Docker (see Docker section)         |

Third-party accounts required (all credentials are set via environment variables):

- Stripe account (API keys + webhook secret)
- bKash sandbox or production developer account
- Resend account (API key + verified sender)
- Cloudinary account (cloud name + API key + secret)
- OpenRouter account (API key + model name)
- `@nestjs/observe` credentials (`OBSERVE_APP_KEY` + `OBSERVE_APP_SECRET`)

---

## Environment Variable Reference

Built from `src/common/env/env.ts` (Zod schema). All variables are **required** unless noted.

### Core Application

| Variable     | Purpose                                    | Required                                    | Placeholder             |
| ------------ | ------------------------------------------ | ------------------------------------------- | ----------------------- |
| `NODE_ENV`   | Runtime mode                               | Optional (default: `development`)           | `development`           |
| `PORT`       | HTTP listen port                           | Optional (default: `5000`)                  | `5000`                  |
| `APP_NAME`   | Application name; used as Redis key prefix | Optional (default: `OrderFlow`)             | `order-flow`            |
| `SERVER_URL` | Full base URL of the API                   | **Required**                                | `http://localhost:5000` |
| `CLIENT_URL` | Frontend application URL                   | Optional (default: `http://localhost:3000`) | `http://localhost:3000` |

### Database

| Variable       | Purpose                      | Required     | Placeholder                                            |
| -------------- | ---------------------------- | ------------ | ------------------------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string | **Required** | `postgresql://user:password@localhost:5432/order-flow` |
| `REDIS_URL`    | Redis connection string      | **Required** | `redis://localhost:6379`                               |

### JWT Authentication

| Variable                      | Purpose                                  | Required                  | Placeholder                        |
| ----------------------------- | ---------------------------------------- | ------------------------- | ---------------------------------- |
| `ACCESS_TOKEN_SECRET`         | Signing secret for access tokens         | **Required**              | `your-access-token-secret`         |
| `ACCESS_TOKEN_EXPIRES`        | Access token TTL (ms-compatible string)  | Optional (default: `12h`) | `15m`                              |
| `REFRESH_TOKEN_SECRET`        | Signing secret for refresh tokens        | **Required**              | `your-refresh-token-secret`        |
| `REFRESH_TOKEN_EXPIRES`       | Refresh token TTL (ms-compatible string) | Optional (default: `7d`)  | `7d`                               |
| `PASSWORD_RESET_TOKEN_SECRET` | Signing secret for password-reset tokens | **Required**              | `your-password-reset-token-secret` |

Generate secrets with:

```bash
openssl rand -base64 32
```

### Email (Resend)

| Variable           | Purpose                       | Required     | Placeholder                    |
| ------------------ | ----------------------------- | ------------ | ------------------------------ |
| `RESEND_API_KEY`   | Resend API authentication     | **Required** | `re_xxxxxxxxxxxxxxxxxxxxxxxxx` |
| `EMAIL_FROM_EMAIL` | Verified sender email address | **Required** | `onboarding@resend.dev`        |

For testing, `onboarding@resend.dev` works with Resend's sandbox. For production, use a verified domain.

### Stripe

| Variable                | Purpose                         | Required     | Placeholder                         |
| ----------------------- | ------------------------------- | ------------ | ----------------------------------- |
| `STRIPE_SECRET_KEY`     | Stripe secret API key           | **Required** | `sk_test_xxxxxxxxxxxxxxxxxxxxxxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint signing secret | **Required** | `whsec_xxxxxxxxxxxxxxxxxxxxxxxxx`   |

`STRIPE_PUBLIC_KEY` appears in `.env.example` but is not required server-side (not in the Zod validation schema). It is safe to omit.

### bKash

| Variable           | Purpose                  | Required     | Placeholder                                              |
| ------------------ | ------------------------ | ------------ | -------------------------------------------------------- |
| `BKASH_BASE_URL`   | bKash API base URL       | **Required** | `https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized` |
| `BKASH_USERNAME`   | bKash API username       | **Required** | `sandboxTokenizedUser02`                                 |
| `BKASH_PASSWORD`   | bKash API password       | **Required** | `sandboxTokenizedUser02@12345`                           |
| `BKASH_APP_KEY`    | bKash application key    | **Required** | `your-bkash-app-key`                                     |
| `BKASH_APP_SECRET` | bKash application secret | **Required** | `your-bkash-app-secret`                                  |

The placeholder `BKASH_BASE_URL` in `.env.example` is the sandbox URL. Change to the production URL for live deployments.

### Cloudinary

| Variable                | Purpose                     | Required     | Placeholder       |
| ----------------------- | --------------------------- | ------------ | ----------------- |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier | **Required** | `your-cloud-name` |
| `CLOUDINARY_API_KEY`    | Cloudinary API key          | **Required** | `your-api-key`    |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret       | **Required** | `your-api-secret` |

### LLM (OpenRouter)

| Variable             | Purpose                               | Required     | Placeholder                         |
| -------------------- | ------------------------------------- | ------------ | ----------------------------------- |
| `OPENROUTER_API_KEY` | OpenRouter authentication             | **Required** | `sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx` |
| `OPENROUTER_MODEL`   | Model identifier passed to OpenRouter | **Required** | `openai/gpt-4o-mini`                |

The LLM is used exclusively for AI-generated product review summaries. Any OpenRouter-compatible model can be specified.

### Observability

| Variable             | Purpose                              | Required     | Placeholder               |
| -------------------- | ------------------------------------ | ------------ | ------------------------- |
| `OBSERVE_APP_KEY`    | `@nestjs/observe` application key    | **Required** | `your-observe-app-key`    |
| `OBSERVE_APP_SECRET` | `@nestjs/observe` application secret | **Required** | `your-observe-app-secret` |

### Queue Dashboard

| Variable          | Purpose                        | Required | Default |
| ----------------- | ------------------------------ | -------- | ------- |
| `SHOW_BULL_BOARD` | Enable Bull Board at `/queues` | Optional | `false` |

Set to `true` to mount the Bull Board UI. Accessible at `http://localhost:<PORT>/queues`.

---

## Local Setup

### 1. Clone and Install

```bash
git clone https://github.com/habib33-3/order-flow.git
cd order-flow
pnpm install
```

`pnpm install` runs `postinstall` which executes `prisma generate` automatically.

### 2. Configure Environment

```bash
# Linux / macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Edit `.env` with your actual credentials. Refer to the variable reference above.

### 3. Start Postgres and Redis

If you do not have Postgres and Redis installed locally, start them via Docker:

```bash
docker run -d --name pg -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password \
    -e POSTGRES_DB=order-flow -p 5432:5432 postgres:17-alpine

docker run -d --name redis -p 6379:6379 redis:7-alpine
```

Or use the included Compose file for the infrastructure only — see the Docker section.

### 4. Apply Migrations

```bash
pnpm prisma migrate dev
```

This creates the database schema and applies all pending migrations.

### 5. Seed (Optional)

```bash
pnpm prisma db seed
```

Equivalent to `pnpm seed` — runs `prisma/seed.ts` via `tsx`. Seeds demo users, products, categories, and orders.

### 6. Start Development Server

```bash
pnpm start:dev
```

The API is available at `http://localhost:5000`. Swagger UI is at `http://localhost:5000/api/docs`.

### 7. Build and Run Production Bundle

```bash
pnpm build
pnpm start:prod
```

`start:prod` runs `node dist/src/main`.

---

## Useful Commands

| Command                      | Purpose                            |
| ---------------------------- | ---------------------------------- |
| `pnpm start:dev`             | Start dev server with watch mode   |
| `pnpm build`                 | Compile TypeScript to `dist/`      |
| `pnpm start:prod`            | Run compiled production build      |
| `pnpm lint`                  | Run ESLint                         |
| `pnpm lint:fix`              | Auto-fix lint issues               |
| `pnpm format`                | Run Prettier                       |
| `pnpm test`                  | Run Jest unit tests                |
| `pnpm test:cov`              | Run Jest with coverage report      |
| `pnpm prisma migrate dev`    | Create and apply dev migrations    |
| `pnpm prisma migrate deploy` | Apply migrations (production / CI) |
| `pnpm prisma db seed`        | Reset and seed demo data           |
| `pnpm seed`                  | Alias for `tsx prisma/seed.ts`     |
