# Order Flow

**Order Flow** is a production-oriented e-commerce backend API built with **NestJS, TypeScript, PostgreSQL, Prisma, Redis, and BullMQ**.

It demonstrates a scalable backend architecture with secure authentication, inventory-aware order processing, multiple payment providers, asynchronous background jobs, caching, transactional email, and containerized deployment.

<p align="center">
  <a href="https://order-flow-ek0j.onrender.com">Live API</a> •
  <a href="https://order-flow-ek0j.onrender.com/api/docs">Swagger Docs</a> •
  <a href="https://github.com/habib33-3/order-flow/issues">Report an Issue</a>
</p>

---

## Highlights

- **Authentication & Authorization** — JWT access/refresh tokens, refresh-token rotation, Argon2 password hashing, email OTP verification, password reset, and role-based access control.
- **Catalog & Inventory** — Product/category management, Cloudinary image uploads, stock tracking, and inventory validation.
- **Cart & Orders** — Redis-backed cart caching, transactional order creation, stock checks, inventory reservation, cancellation, and cursor pagination.
- **Payments** — Stripe Checkout and bKash Tokenized Checkout through a shared payment abstraction with idempotent processing and webhook/callback handling.
- **Background Processing** — BullMQ workers for transactional email and payment expiry/recovery with retries, exponential backoff, and delayed jobs.
- **Production Infrastructure** — PostgreSQL as the source of truth, Redis for caching and queues, Docker Compose for local infrastructure, and centralized application configuration/validation.

---

## Architecture

```text
                         Client
                           |
                           v
                  NestJS REST API
                     /api/v1
                           |
        +------------------+------------------+
        |                  |                  |
        v                  v                  v
     Prisma             Redis            Providers
        |                  |            /     |      \
        v                  |         Stripe  bKash  Cloudinary
   PostgreSQL              |
                           +---- Cart Cache
                           +---- Refresh Tokens
                           +---- BullMQ
                                  |
                         +--------+--------+
                         |                 |
                    Email Worker    Payment Worker
                         |                 |
                       Resend       Payment Recovery
```

PostgreSQL remains the authoritative data store for users, products, carts, orders, addresses, and payments.

Redis is used for cart caching, refresh-token storage, and BullMQ queue state. Cart operations use a cache-aside strategy with explicit invalidation after mutations, while stock is validated again during order creation to maintain database-level correctness.

Provider-specific integrations are isolated behind dedicated modules, keeping payment concerns separate from core order processing.

---

## Tech Stack

| Area            | Technology                        |
| --------------- | --------------------------------- |
| Framework       | NestJS 11                         |
| Language        | TypeScript 5                      |
| Runtime         | Node.js 24                        |
| Database        | PostgreSQL 17                     |
| ORM             | Prisma 7 + `@prisma/adapter-pg`   |
| Cache           | Redis + ioredis                   |
| Background Jobs | BullMQ 6                          |
| Authentication  | Passport JWT + Argon2             |
| Payments        | Stripe + bKash Tokenized Checkout |
| Image Storage   | Cloudinary                        |
| Email           | Resend + Handlebars               |
| Validation      | class-validator + Zod             |
| Infrastructure  | Docker + Docker Compose           |
| Package Manager | pnpm 11                           |

---

## API

The REST API is available under:

```text
/api/v1
```

Interactive API documentation is available through Swagger:

```text
/api/docs
```

### Main API Areas

| Area                | Examples                                                                     |
| ------------------- | ---------------------------------------------------------------------------- |
| Authentication      | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` |
| Password Management | `/password/change`, `/password/forgot`, `/password/reset`                    |
| Products            | `/products`, `/products/:id`, `/products/:id/images`                         |
| Categories          | `/category`, `/category/:id`                                                 |
| Cart                | `/cart`, `/cart/add-item`, `/cart/manage`                                    |
| Orders              | `/orders`, `/orders/me`, `/orders/:id`, `/orders/:id/cancel`                 |
| Shipping            | `/shipping-address`, `/shipping-address/:id`                                 |
| User Profile        | `/user/me`, `/user/me/avatar`                                                |
| Payments            | `/payments/stripe/webhook`, `/payments/bkash/callback`                       |

Most protected endpoints require a bearer access token. Role-based authorization is applied to administrative operations where required.

See the Swagger documentation for complete request, response, query, and authentication details.

---

## Background Processing

Order Flow uses **BullMQ + Redis** for asynchronous and delayed workloads.

Current background jobs include:

- Transactional email delivery through Resend
- Five-minute delayed payment expiry
- Scheduled payment recovery every five minutes
- Automatic retries with exponential backoff
- Job retention and cleanup policies
- Optional Bull Board monitoring

The queue dashboard can be enabled with:

```env
SHOW_BULL_BOARD=true
```

and accessed at:

```text
/queues
```

---

## Getting Started

### Requirements

- Node.js 24+
- pnpm 11+
- PostgreSQL 17+
- Redis 7+
- Stripe credentials
- bKash credentials
- Resend credentials
- Cloudinary credentials

Docker Desktop can be used instead of installing PostgreSQL and Redis locally.

### Installation

```bash
git clone https://github.com/habib33-3/order-flow.git
cd order-flow

pnpm install
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure the required environment variables, then apply the database migrations:

```bash
pnpm prisma migrate dev
```

Optionally seed the database:

```bash
pnpm prisma db seed
```

Start the development server:

```bash
pnpm start:dev
```

The API will be available at:

```text
http://localhost:5000
```

Swagger:

```text
http://localhost:5000/api/docs
```

---

## Docker

The included Compose configuration runs:

- NestJS API
- PostgreSQL
- Redis

Create the Docker environment file:

```bash
cp .env.example .env.docker
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.docker
```

Use Docker service names for internal connections:

```env
DATABASE_URL=postgresql://user:password@db:5432/order-flow
REDIS_URL=redis://redis:6379
SERVER_URL=http://localhost:5000
```

Start the stack:

```bash
docker compose up --build
```

Apply migrations:

```bash
docker compose exec app pnpm prisma migrate deploy
```

Optionally seed the database:

```bash
docker compose exec app pnpm prisma db seed
```

Stop the stack:

```bash
docker compose down
```

Use `docker compose down -v` only when you intentionally want to remove the persisted database and Redis volumes.

---

## Environment Configuration

`.env.example` documents the complete configuration required by the application.

Core configuration includes:

```text
DATABASE_URL
REDIS_URL
SERVER_URL
EMAIL_FROM_EMAIL

ACCESS_TOKEN_SECRET
ACCESS_TOKEN_EXPIRES
REFRESH_TOKEN_SECRET
REFRESH_TOKEN_EXPIRES
PASSWORD_RESET_TOKEN_SECRET
```

Provider configuration includes credentials for:

```text
Stripe
bKash
Resend
Cloudinary
```

Application configuration is validated with **Zod** during startup.

Never commit `.env`, `.env.docker`, or production credentials.

---

## Useful Commands

| Command                      | Purpose                             |
| ---------------------------- | ----------------------------------- |
| `pnpm start:dev`             | Start development server            |
| `pnpm build`                 | Build the application               |
| `pnpm start:prod`            | Run the production build            |
| `pnpm lint`                  | Run ESLint                          |
| `pnpm lint:fix`              | Automatically fix lint issues       |
| `pnpm test`                  | Run unit tests                      |
| `pnpm test:e2e`              | Run end-to-end tests                |
| `pnpm prisma migrate dev`    | Create/apply development migrations |
| `pnpm prisma migrate deploy` | Apply production migrations         |
| `pnpm prisma db seed`        | Reset and seed demo data            |

---

## Project Structure

```text
prisma/
├── schema.prisma
├── migrations/
└── seed.ts

src/
├── common/              # Shared infrastructure and utilities
├── jobs/                # Scheduled background jobs
├── modules/
│   ├── auth/
│   ├── users/
│   ├── products/
│   ├── categories/
│   ├── carts/
│   ├── orders/
│   ├── payments/
│   └── addresses/
└── generated/prisma/    # Generated Prisma client

docs/                    # Infrastructure documentation
compose.yml              # Local infrastructure
Dockerfile               # Production container
```

---

## License

This project is licensed under the [MIT License](License).
