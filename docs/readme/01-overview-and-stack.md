# Phase 2 — Overview and Stack

## Title

# Order Flow

Production-oriented e-commerce backend API built with NestJS, TypeScript, PostgreSQL, Prisma, Redis, and BullMQ.

## Badges

[![CI/CD — Build, Push & Deploy](https://github.com/habib33-3/order-flow/actions/workflows/build-push.yml/badge.svg)](https://github.com/habib33-3/order-flow/actions/workflows/build-push.yml)
[![Neon DB Migration](https://github.com/habib33-3/order-flow/actions/workflows/db-migration.yml/badge.svg)](https://github.com/habib33-3/order-flow/actions/workflows/db-migration.yml)

Note: No test-coverage badge. CI does not run tests; only build and lint pass/fail.

## Description

Order Flow is a backend REST API for a multi-domain e-commerce platform. It handles authentication, product catalog, cart management, order processing with inventory reservation, multi-provider payments (Stripe and bKash Tokenized Checkout), asynchronous background jobs, Redis-backed caching, and AI-generated product review summaries via a configurable LLM provider.

The project is designed to demonstrate production-relevant backend patterns: transactional data consistency, cache-aside with explicit invalidation, a payment strategy abstraction, BullMQ-driven deferred processing with exponential backoff, and structured LLM output with in-flight deduplication.

## Key Features (Grouped)

### Authentication

- Registration with email OTP verification (Argon2 hash stored in Redis, 10 min TTL)
- Login with cache-assisted user lookup (cache-aside on email key)
- JWT access + refresh tokens; refresh-token rotation with Redis storage
- Forgot password and reset via OTP email + signed JWT
- Role-based access control (ADMIN / USER); global access-token guard with per-endpoint opt-out

### Catalog

- Products with SKU, thumbnail, image gallery (Cloudinary), price, stock, and status lifecycle (DRAFT / ACTIVE / ARCHIVED)
- Categories with logo
- Cursor-based pagination on product and category lists
- Cache-aside caching for single-resource and list queries; explicit invalidation on mutations

### Cart

- One cart per authenticated user; cart items keyed by product
- Full cache-aside caching; cache deleted on every write (add, update quantity, remove, clear)

### Orders

- Transactional order creation: stock validation, inventory reservation, optional coupon redemption — all inside a single Prisma transaction
- Order lifecycle: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED / CANCELED
- Cancellation restricted to PENDING orders; reserved stock restored in same transaction

### Payments

- Strategy abstraction over Stripe Checkout and bKash Tokenized Checkout
- Idempotency key stored per payment record; unique constraint on (provider, idempotencyKey)
- Stripe: webhook events for success, async success, failure, and session expiry; signature verified
- bKash: callback handler with execute → query-status fallback
- Delayed BullMQ job (5 min) to expire payments that are not completed; cron-based recovery sweep every 5 minutes

### Coupons

- PERCENTAGE and FIXED discount types
- Global redemption limits and per-user limits
- Date-bounded validity; minimum order amount; maximum discount amount cap
- Redemption recorded in transaction with order creation; coupon cache invalidated post-commit

### Reviews and AI Summaries

- Per-user product reviews (one per user+product) and platform reviews (one per user)
- Analytics modules: rating summaries and trend data
- AI-generated product review summaries via LangChain + OpenRouter (configurable model)
    - In-flight deduplication (in-process Map) prevents concurrent LLM calls for same product
    - Cached 12 hours, keyed by (productId, promptVersion)
    - Requires ≥ 3 reviews; returns generic summary otherwise

### Background Processing

- BullMQ queues: "email" (transactional email via Resend), "payment" (delayed expiry jobs)
- Default: 3 attempts, exponential backoff (5 s base), completed retained 1 h, failed retained 24 h
- Optional Bull Board dashboard at `/queues`

### Infrastructure

- Zod environment validation at startup; app will not boot with missing or invalid variables
- Helmet HTTP security headers; global ValidationPipe (whitelist, forbidNonWhitelisted)
- Docker multi-stage build; Docker Compose with health checks for Postgres and Redis
- Two GitHub Actions workflows: CI/CD with Docker push + Render deploy; automatic DB migration to Neon on schema changes

## Tech Stack

| Category        | Technology                                       |
| --------------- | ------------------------------------------------ |
| Framework       | NestJS 12                                        |
| Language        | TypeScript 6                                     |
| Runtime         | Node.js 24                                       |
| Database        | PostgreSQL 17                                    |
| ORM             | Prisma 7 + `@prisma/adapter-pg`                  |
| Cache           | Redis via ioredis                                |
| Queue           | BullMQ 6 + `@nestjs/bullmq`                      |
| Auth            | `@nestjs/passport` + `passport-jwt` + Argon2     |
| Payments        | Stripe (`stripe` v22) + bKash Tokenized Checkout |
| Image Storage   | Cloudinary                                       |
| Email           | Resend + Handlebars templates                    |
| LLM             | LangChain (`@langchain/openai`) via OpenRouter   |
| Validation      | class-validator + Zod                            |
| HTTP Security   | Helmet                                           |
| Package Manager | pnpm 12                                          |
| Infrastructure  | Docker + Docker Compose                          |
| Observability   | `@nestjs/observe` (telemetry)                    |
