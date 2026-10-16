# README Generation Progress

## Session Completed

Date: 2026-10-16

## Final Status: COMPLETED

| Phase | File                            | Status    |
| ----- | ------------------------------- | --------- |
| 1     | 00-audit.md                     | COMPLETED |
| 2     | 01-overview-and-stack.md        | COMPLETED |
| 3     | 02-architecture-and-database.md | COMPLETED |
| 4     | 03-workflows-and-caching.md     | COMPLETED |
| 5     | 04-setup-and-environment.md     | COMPLETED |
| 6     | 05-docker-testing-and-ci.md     | COMPLETED |
| 7     | 06-links-and-final-sections.md  | COMPLETED |
| 8     | 07-final-review.md              | COMPLETED |
| Final | README.md assembly              | COMPLETED |

## Sources Inspected

- README.md (existing, replaced)
- package.json
- .env.example
- Dockerfile
- compose.yml
- prisma/schema/*.prisma (all 10 files)
- prisma/migrations/ (SQL verified for subtotal field)
- src/app.module.ts
- src/main.ts
- src/common/env/env.ts
- src/common/redis/cache-key.ts
- src/common/redis/redis.service.ts
- src/common/queue/queue.module.ts
- src/common/queue/queue.constants.ts
- src/common/llm/llm.service.ts
- src/jobs/expire-payment.cron.service.ts
- src/modules/auth/auth/auth.service.ts
- src/modules/orders/create-order.service.ts
- src/modules/orders/orders.service.ts
- src/modules/payment/payment.service.ts
- src/modules/payment/stripe/stripe-webhook.service.ts
- src/modules/payment/bkash/bkash-callback.service.ts
- src/modules/payment/job/payment.queue.service.ts
- src/modules/cart/cart.service.ts
- src/modules/product-review-summary/product-review-summary.service.ts
- src/modules/product-review-summary/product-review-summary.constants.ts
- .github/workflows/build-push.yml
- .github/workflows/db-migration.yml

## Verified Facts

- Stack: NestJS 12, TypeScript 6, Node.js 24, PostgreSQL 17, Prisma 7, Redis (ioredis), BullMQ 6
- LLM: @langchain/openai via OpenRouter (ChatOpenAI, baseURL: https://openrouter.ai/api/v1)
- All env vars required (z.string() without .optional()); some have .default()
- STRIPE_PUBLIC_KEY in .env.example but NOT in env.ts schema — correctly omitted from required list
- Compose container names use raco-ai-job-task prefix — noted as known limitation
- Queues: email, payment
- Cart cache TTL: 3600s default
- LLM summary TTL: 43200s (12h), SUMMARY_TTL = 12 * 60 * 60
- In-flight deduplication for LLM summaries: confirmed (inFlight Map)
- Payment expiry: BullMQ 5-min delay + @Cron every 5 min recovery
- Stripe events: completed, async_payment_succeeded, async_payment_failed, checkout.session.expired
- OTP rate limiting via Redis SET NX 60s
- Helmet, ValidationPipe (whitelist+forbidNonWhitelisted), global AccessTokenGuard
- @nestjs/throttler installed but @Throttle() not applied anywhere — omitted from README
- OBSERVE_APP_KEY and OBSERVE_APP_SECRET required (not in .env.example)
- Two CI workflows: build-push.yml, db-migration.yml
- Only product-review-summary spec files found — documented as known limitation

## Unresolved Questions (Handled)

- Test coverage: documented as "minimal" in Known Limitations
- Throttler: omitted from README (not applied)
- STRIPE_PUBLIC_KEY: noted as "not required server-side"
- POSTGRES_USER/POSTGRES_DB for Compose: noted in Docker section
- Order schema subtotal field: verified via migration SQL

## Artifacts Created

- docs/readme/00-audit.md
- docs/readme/01-overview-and-stack.md
- docs/readme/02-architecture-and-database.md
- docs/readme/03-workflows-and-caching.md
- docs/readme/04-setup-and-environment.md
- docs/readme/05-docker-testing-and-ci.md
- docs/readme/06-links-and-final-sections.md
- docs/readme/07-final-review.md
- README.md (final, at repo root)
