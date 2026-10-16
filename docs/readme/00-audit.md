# Phase 1 — Audit

## Verified Implemented Features

### Authentication & Users

- Registration with Argon2 password hashing (`argon2.hash`)
- Email OTP verification stored as Argon2 hash in Redis, 10-minute TTL, rate-limited resend (60 s via SET NX)
- Login with cache-aside lookup (`user:email:<email>` key, default 1 h TTL)
- JWT access + refresh tokens, refresh token stored in Redis by user ID
- Refresh-token rotation: old token deleted from Redis, new pair issued
- Logout: deletes refresh token from Redis
- Forgot password / reset password (OTP via email + signed reset token)
- Role-based access control: `UserRole` enum (ADMIN, USER); `AdminGuard`
- Global `AccessTokenGuard` registered as `APP_GUARD`; endpoints opt-out with `@Public()`
- User status: PENDING → ACTIVE → SUSPENDED

### Products & Categories

- CRUD for products (DRAFT / ACTIVE / ARCHIVED) and categories
- Cloudinary image uploads (thumbnail + images array)
- Cursor-based pagination on product list with search, filter, sort
- Cache-aside on product by ID and product list (keyed on all query params)
- Cache invalidated on create/update/delete

### Cart

- One cart per user (unique constraint `userId`)
- Cart items keyed on `(cartId, productId)`
- Cart cached in Redis under `cart:userId:<userId>`, default 1 h TTL
- Cache deleted on add, manage (batch quantity update), remove, and clear

### Orders

- Order creation validated inside a Prisma transaction:
    1. Re-fetch products from DB inside transaction
    2. Validate status (ACTIVE) and sufficient stock
    3. Optionally redeem coupon (also inside same transaction)
    4. Create order + order items
    5. Decrement stock (`updateMany` with `gte` guard — prevents race)
- Coupon cache invalidated post-commit
- Cancellation: PENDING only; restores stock in transaction
- Lifecycle: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED / CANCELED
- Cursor pagination; search by user name/email; filter by status

### Payments

- Shared `PaymentService` with strategy pattern: `StripeStrategy`, `BkashStrategy`
- Idempotency key: `${crypto.randomUUID()}-${Date.now()}` stored in DB
- Unique constraints: `(provider, idempotencyKey)` and `(provider, transactionId)`
- BullMQ delayed job enqueued at payment creation: 5-minute expiry (`jobId: expire-payment:<paymentId>`)
- Stripe: Checkout Session; webhook events: `checkout.session.completed`, `async_payment_succeeded`, `async_payment_failed`, `checkout.session.expired`; signature verified with `STRIPE_WEBHOOK_SECRET`
- bKash: Tokenized Checkout; callback with execute → query fallback
- `handlePaymentSuccess`: marks payment PAID, order CONFIRMED (within transaction)
- `handlePaymentFailed`: marks payment FAILED, order CANCELED (within transaction)
- `handlePaymentExpired`: marks payment EXPIRED; cancels order only if no other PENDING/PAID payment exists
- `expirePayment` (BullMQ job handler): same idempotent logic as `handlePaymentExpired`

### Background Jobs

- BullMQ queue "email": transactional emails via Resend + Handlebars templates
- BullMQ queue "payment": delayed payment expiry jobs
- Default job options: 3 attempts, exponential backoff (5 s base), completed jobs retained 1 h / 1000 count, failed jobs 24 h / 1000 count
- Recovery cron (`@Cron(EVERY_5_MINUTES)`): batched sweep (100 records/batch) of `PENDING` payments where `expiresAt < now`
- Bull Board dashboard (optional, `SHOW_BULL_BOARD=true`) at `/queues`

### Caching

- Cache pattern: cache-aside (read → miss → DB → populate). No write-through.
- All keys prefixed `${APP_NAME}-cache:<domain>:...`
- Cache invalidation: explicit `redis.delete(key)` after mutations
- TTL default: 3600 s
- LLM summary TTL: 43200 s (12 h), per `(productId, promptVersion)` key
- In-flight deduplication for LLM summaries: `inFlight: Map<string, Promise<ProductReviewSummary>>`; concurrent requests for same key share one LLM call
- No distributed lock (no Redlock, no SETNX mutex) — only in-process promise sharing

### AI Review Summary

- Requires ≥ 3 reviews; below threshold returns `GENERIC_REVIEW_SUMMARY` without LLM call
- Loads up to 100 most-recent reviews (capped at 500 chars each)
- Computes aggregate stats (avg rating, star distribution) in parallel with review fetch
- LangChain `ChatOpenAI` pointing to OpenRouter (`https://openrouter.ai/api/v1`)
- Structured output via Zod schema (`ProductReviewSummarySchema`) and function calling
- Cached result validated with Zod on read; invalid cache → regenerate
- All errors fall back to `GENERIC_REVIEW_SUMMARY` (non-throwing)
- Prompt injection mitigation: closing tag escaping in review text; system prompt instructs treating review text as untrusted data

### Coupons

- PERCENTAGE and FIXED types
- `startAt`, `endAt`, `minimumOrderAmount`, `maximumDiscountAmount`
- Global limit (`maxLimit`, `remainingLimit`) and per-user limit (`maxLimitPerUser`)
- `CouponRedeem` join table tracks per-user usage
- Coupon redemption occurs inside order creation transaction
- Coupon analytics module exists

### Reviews

- `ProductReview` (one per user+product) and `PlatformReview` (one per user)
- Analytics modules for both (summaries, trends)

### Infrastructure & Security

- Helmet HTTP headers (`helmet()`)
- ValidationPipe: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- `@nestjs/throttler` v6.7.1 installed; no `@Throttle()` decorators found in src — rate limiter is NOT applied to any routes
- `@nestjs/observe` telemetry integration (requires `OBSERVE_APP_KEY` + `OBSERVE_APP_SECRET`)
- CORS enabled globally (`app.enableCors()`)
- Zod env validation at startup; missing/invalid vars prevent boot

### CI/CD

- `build-push.yml`: on push to `main` — install, build, lint → (on main push only) Docker build, push to Docker Hub, trigger Render deploy hook
- `db-migration.yml`: on push to `main` with changes to `prisma/migrations/`, schema files, or config files — runs `prisma migrate deploy` against Neon DB (via `DATABASE_URL` secret)
- No automated test step in CI (build and lint only)

## Assessment of Existing README

The existing README is accurate in all its core claims. Items that were incomplete or need clarification:

- Project structure shows `users/` and `categories/` module names; actual directory names are `user/` and `category/`
- Lists `pnpm test` and `pnpm test:e2e` as commands; no test suite confirmed (only spec stubs for product-review-summary); commands exist in package.json but CI does not run them
- Does not mention the `OBSERVE_APP_KEY`/`OBSERVE_APP_SECRET` or `OPENROUTER_API_KEY`/`OPENROUTER_MODEL` env vars
- Does not mention the `LlmModule` / OpenRouter integration
- Does not document the in-flight deduplication on LLM summaries
- Mentions cursor pagination — confirmed
- Mentions throttler via `@nestjs/throttler` — installed but not applied to routes; omit from README

## Unresolved Questions

1. No e2e test directory (`test/` or similar) found; `pnpm test:e2e` targets `./test/jest-e2e.json` which likely does not exist
2. `STRIPE_PUBLIC_KEY` is in `.env.example` but not in the Zod schema; it appears unused server-side
3. Throttler is installed but no `@Throttle()` usage found — whether it is intentionally unused is unclear; documenting it would be inaccurate
4. Compose container names use `raco-ai-job-task` prefix — likely a copy from a previous project; does not affect functionality but worth noting
