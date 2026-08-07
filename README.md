<div align="center">

# Order Flow

**A production-ready e-commerce backend built with NestJS, TypeScript, PostgreSQL, and Prisma.**

Secure JWT auth, dual payment gateways (Stripe + bKash), Redis caching, background jobs, and a fully automated Docker + GitHub Actions CI/CD pipeline — built to demonstrate real-world backend architecture, not tutorial code.

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

[**Live API**](https://order-flow-ek0j.onrender.com) · [**Swagger Docs**](https://order-flow-ek0j.onrender.com/api/docs) · [**Report Issue**](https://github.com/habib33-3/order-flow/issues)

</div>

---

## Highlights

|                    |                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------- |
| 🔐 **Auth**        | JWT access/refresh rotation, Argon2 hashing, email OTP, role-based access (`ADMIN`, `USER`)  |
| 💳 **Payments**    | Stripe + bKash behind a shared abstraction — Strategy Pattern for provider-agnostic checkout |
| ⚡ **Performance** | Redis-backed caching and refresh-token storage, cursor-based pagination for orders           |
| 🐳 **Infra**       | Fully Dockerized dev environment, GitHub Actions CI/CD with automated Prisma migrations      |
| 📄 **Docs**        | Complete Swagger/OpenAPI spec, Zod-validated environment config                              |

---

## Architecture

Modular NestJS application with PostgreSQL as the system of record and Redis for caching and short-lived state. External services (Stripe, bKash, Cloudinary, Resend) are isolated behind dedicated modules so no domain logic depends on a specific provider.

```
                              Client
                                 │
                                 ▼
                       REST API (NestJS)
                                 │
      ┌───────────────┬─────────┴─────────┬───────────────┐
      ▼                ▼                   ▼               ▼
 Authentication   Products & Orders   Payment Module    User Module
      │                │                   │               │
      └────────────────┴─────────┬─────────┴───────────────┘
                                  ▼
                             Prisma ORM
                                  │
                                  ▼
                             PostgreSQL
                                  │
                       ┌──────────┴──────────┐
                       │      Redis Cache     │
                       │  refresh tokens ·    │
                       │  API response cache · │
                       │  short-lived state    │
                       └──────────┬──────────┘
      ┌───────────────┬───────────┼───────────────┐
      ▼                ▼          ▼               ▼
 Cloudinary         Stripe       bKash          Resend
 (images)         (payments)  (payments)      (email)
```

**Cache-aside pattern:** every read checks Redis first; on a miss, the service queries PostgreSQL, populates the cache, then returns the response — keeping hot paths fast without sacrificing consistency.

```
Request → Cache hit? ──Yes──→ Return Redis data
              │
              No
              ▼
        Query PostgreSQL → Store in Redis → Return response
```

---

## Tech Stack

| Layer               | Technologies                           |
| ------------------- | -------------------------------------- |
| **Backend**         | NestJS 11, TypeScript 5, Node.js 24    |
| **Database**        | PostgreSQL 17, Prisma ORM              |
| **Auth**            | Passport JWT, Argon2                   |
| **Cache**           | Redis, ioredis                         |
| **Payments**        | Stripe, bKash (Tokenized Checkout)     |
| **Storage / Email** | Cloudinary, Resend, Handlebars         |
| **Validation**      | class-validator, Zod                   |
| **Infra**           | Docker, Docker Compose, GitHub Actions |
| **Package Manager** | pnpm                                   |

---

## Feature Overview

**Authentication & Authorization** — JWT access/refresh tokens, email OTP verification, password reset flow, role-based guards, Argon2 password hashing.

**Product Management** — Category CRUD, product CRUD, Cloudinary image uploads, inventory/stock tracking, product status lifecycle.

**Order Management** — Order creation and cancellation, cursor-based pagination, shipping address management.

**Payments** — Stripe Checkout, bKash Tokenized Checkout, unified webhook/callback handling, automatic payment expiration via scheduled jobs.

**Infrastructure** — Redis caching, cron-driven background jobs, Swagger documentation, Docker & Docker Compose, GitHub Actions CI/CD.

---

## Key Engineering Decisions

- **Strategy Pattern for payments** — Stripe and bKash implement a common interface, so adding a new provider doesn't touch order or checkout logic.
- **Redis for both cache and session state** — refresh tokens and hot API responses share one cache layer, reducing infrastructure surface area.
- **Zod-validated environment config** — the app fails fast at boot if required env vars are missing or malformed, instead of surfacing errors at runtime.
- **Centralized exception handling** — consistent error shape across every module via a global filter.
- **Automated migrations in CI** — `prisma migrate deploy` runs against Neon Postgres as part of the GitHub Actions pipeline, not manually.

---

## Technical Challenges Solved

- JWT authentication with refresh token rotation and Redis-backed revocation
- A common abstraction supporting multiple payment providers with different callback shapes
- Idempotent handling of asynchronous payment webhooks
- Automated, zero-touch production database migrations
- A fully containerized local dev environment matching production topology

---

## Project Structure

```text
order-flow/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── common/
│   ├── generated/
│   ├── jobs/
│   ├── modules/
│   │   ├── auth/
│   │   ├── category/
│   │   ├── orders/
│   │   ├── payment/
│   │   ├── products/
│   │   ├── shipping-address/
│   │   └── user/
│   ├── app.module.ts
│   └── main.ts
│
├── compose.yml
├── Dockerfile
├── prisma.config.ts
└── package.json
```

---

## Quick Start

**Prerequisites:** Node.js 24+, pnpm, PostgreSQL 17, Redis (or use Docker below)

```bash
# Clone
git clone https://github.com/habib33-3/order-flow.git
cd order-flow

# Install
pnpm install

# Configure environment
cp .env.example .env
# → update the values in .env

# Run migrations
pnpm prisma migrate dev

# (optional) seed demo data
pnpm prisma db seed

# Start dev server
pnpm start:dev
```

API available at **<http://localhost:5000>** · Swagger at **<http://localhost:5000/api/docs>**

### Docker Development

```bash
# .env.docker is gitignored — create it from .env.example first
cp .env.example .env.docker

docker compose up --build
docker compose exec app pnpm prisma migrate deploy
docker compose exec app pnpm prisma db seed # optional
```

Update `.env.docker` with the same variables as `.env.example`, but point database and Redis connection strings to the Compose service hostnames (e.g. `postgres`, `redis`) instead of `localhost`. **Never commit this file or reuse production secrets in it.**

App available at **<http://localhost:5000>**.

---

## Environment Variables

Copy `.env.example` → `.env`. All variables are validated at startup with **Zod**, so misconfiguration fails fast instead of surfacing as a runtime bug.

Configuration covers: PostgreSQL, Redis, JWT secrets, Stripe, bKash, Cloudinary, Resend, and client/server URLs.

Generate JWT secrets with:

```bash
openssl rand -base64 32
```

---

## Development Commands

```bash
pnpm start:dev # dev server with hot reload
pnpm build     # production build
pnpm lint      # lint check
pnpm lint:fix  # lint + autofix
pnpm format    # prettier
pnpm test      # unit tests
pnpm test:e2e  # e2e tests
pnpm test:cov  # coverage report
```

---

## Deployment & CI/CD

Deployed on **Render**, with **PostgreSQL** (Neon), **Redis**, **Cloudinary**, **Stripe**, and **Resend** as managed dependencies.

On every push to `main`, **GitHub Actions**:

1. Builds the application
2. Runs lint checks
3. Deploys Prisma migrations against the production database
4. Builds and publishes a Docker image to Docker Hub

---

## Roadmap

- [x] JWT authentication with refresh rotation
- [x] Role-based authorization
- [x] Product management
- [x] Order management
- [x] Shipping addresses
- [x] Stripe integration
- [x] bKash integration
- [x] Redis caching
- [x] Docker support
- [x] GitHub Actions CI/CD
- [ ] BullMQ email queue
- [ ] Inventory reservation
- [ ] Order analytics dashboard
- [ ] Comprehensive integration test suite

---

## License

MIT License — see [LICENSE](LICENSE) for details.
