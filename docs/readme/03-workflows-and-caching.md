# Phase 4 — Workflows and Caching

## Authentication Flow

### Registration and Email Verification

```mermaid
sequenceDiagram
    participant C as Client
    participant A as AuthService
    participant DB as PostgreSQL
    participant R as Redis
    participant E as Resend (via BullMQ)

    C->>A: POST /auth/register {name, email, password}
    A->>DB: findUnique user by email
    DB-->>A: null (not found)
    A->>A: argon2.hash(password)
    A->>DB: user.create(name, email, hashedPassword)
    DB-->>A: user record (status=PENDING)
    A->>A: generateOtp() — randomInt(1000,9999)
    A->>A: argon2.hash(otp)
    A->>R: SET auth:otp:email:<email> <otpHash> EX 600
    A->>E: sendOtpEmail (via BullMQ email queue)
    A-->>C: {message, userId}

    C->>A: POST /auth/verify-otp {email, otp}
    A->>R: GET auth:otp:email:<email>
    R-->>A: otpHash
    A->>A: argon2.verify(otpHash, otp)
    A->>DB: user.update status=ACTIVE
    A->>R: DEL otp key, DEL user cache keys
    A->>A: generateTokens(user)
    A->>R: SET auth:refresh:id:<userId> <refreshToken> EX (ttl+60)
    A-->>C: {accessToken, refreshToken}
```

### Login

```mermaid
sequenceDiagram
    participant C as Client
    participant A as AuthService
    participant DB as PostgreSQL
    participant R as Redis

    C->>A: POST /auth/login {email, password}
    A->>R: GET user:email:<email>
    alt Cache miss
        R-->>A: null
        A->>DB: findUnique by email
        DB-->>A: user
        A->>R: SET user:email:<email> <user> EX 3600
    else Cache hit
        R-->>A: user
    end
    A->>A: verify status === ACTIVE
    A->>A: argon2.verify(storedHash, password)
    A->>DB: update lastLoginAt
    A->>A: generateTokens(user)
    A->>R: SET auth:refresh:id:<userId> <refreshToken> EX (ttl+60)
    A-->>C: {accessToken, refreshToken}
```

### Refresh Token Rotation

```mermaid
sequenceDiagram
    participant C as Client
    participant A as AuthService
    participant R as Redis

    C->>A: POST /auth/refresh (Bearer: refreshToken)
    A->>A: JWT verify (REFRESH_TOKEN_SECRET)
    A->>R: GET auth:refresh:id:<userId>
    R-->>A: storedToken
    A->>A: storedToken === bearerToken?
    A->>R: DEL auth:refresh:id:<userId>
    A->>A: generateTokens(user) — issues new pair
    A->>R: SET auth:refresh:id:<userId> <newRefreshToken> EX (ttl+60)
    A-->>C: {accessToken, refreshToken}
```

The old refresh token is deleted before the new one is issued. Replaying the old token returns 401 because it no longer exists in Redis.

---

## Order Creation and Inventory Reservation

```mermaid
sequenceDiagram
    participant C as Client
    participant OS as OrdersService
    participant COS as CreateOrderService
    participant DB as PostgreSQL (Transaction)
    participant R as Redis
    participant PS as PaymentService
    participant Q as BullMQ

    C->>OS: POST /orders {shippingAddressId, paymentProvider, currency, couponCode?}
    OS->>COS: getValidatedCartItems(userId)
    COS->>R: GET cart:userId:<userId>
    alt Cache miss
        R-->>COS: null
        COS->>DB: cart.findUnique with items and products
        COS->>R: SET cart:userId:<userId> EX 3600
    end
    COS-->>OS: cartItems (or BadRequest if empty)

    OS->>DB: BEGIN TRANSACTION
    DB->>DB: product.findMany(ids IN cartItems)
    DB->>DB: validate status=ACTIVE, stock >= quantity for each
    DB->>DB: redeemCoupon (if couponCode provided)
    DB->>DB: order.create + orderItems.createMany
    DB->>DB: product.updateMany (decrement stock, WHERE stock >= qty guard)
    DB->>DB: COMMIT

    OS->>R: DEL coupon cache keys (if coupon used)
    OS->>PS: createPaymentCheckout(order, userId, payload)
    PS->>DB: payment.create (status=PENDING, idempotencyKey)
    PS->>PS: getStrategy(provider) → StripeStrategy or BkashStrategy
    PS->>External: provider.createPayment(...)
    External-->>PS: checkout URL / bKash URL
    PS->>Q: paymentQueue.add("EXPIRE_PAYMENT", {paymentId, orderId}, delay=5min)
    PS-->>C: {checkoutUrl} or {bkashURL}
```

### Stock Reservation Safety

The transaction performs `product.updateMany` with a `WHERE stock >= quantity` guard. If stock has been concurrently decremented by another request between the read and the update, the `count === 0` result causes the transaction to throw `BadRequestException`, which rolls back the entire order. This prevents overselling without requiring a separate locking mechanism.

---

## Payment Lifecycle

### Stripe Payment

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant API as NestJS API
    participant S as Stripe
    participant DB as PostgreSQL

    API->>S: createCheckoutSession (line_items, metadata: {paymentId})
    S-->>API: {sessionUrl}
    API-->>U: redirect to sessionUrl

    U->>S: complete payment on Stripe hosted page
    S->>API: POST /payments/stripe/webhook (signature in header)
    API->>API: constructEvent (verify STRIPE_WEBHOOK_SECRET)
    alt checkout.session.completed (payment_status=paid)
        API->>DB: payment.update status=PAID, transactionId=paymentIntentId
        API->>DB: order.update status=CONFIRMED, paidAt=now (WHERE status=PENDING)
    else checkout.session.async_payment_failed
        API->>DB: payment.update status=FAILED
        API->>DB: order.update status=CANCELED, canceledAt=now
    else checkout.session.expired
        API->>DB: payment.update status=EXPIRED
        API->>DB: order.update status=CANCELED (if no other active payment)
    end
```

### bKash Payment

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant API as NestJS API
    participant B as bKash

    API->>B: createPayment (amount, orderId, paymentId)
    B-->>API: {bkashURL, paymentID}
    API-->>U: redirect to bkashURL

    U->>B: complete payment on bKash
    B->>API: GET /payments/bkash/callback?paymentID=...&status=...
    API->>API: find payment by (provider=BKASH, transactionId=paymentID)
    alt already terminal state
        API-->>B: return existing payment (idempotent)
    else status != success
        API->>API: handlePaymentFailed(paymentId)
    else status == success
        API->>B: executePayment(paymentID)
        alt transactionStatus == Completed
            API->>API: handlePaymentSuccess(paymentId, trxID)
        else transactionStatus == Failed
            API->>API: handlePaymentFailed(paymentId)
        else unknown status
            API->>B: queryPayment(paymentID)
            API->>API: handlePaymentFailed if Failed
        end
    end
```

### Payment Expiry — Two Layers

**Layer 1 — BullMQ delayed job:**
When a payment is created, a BullMQ job is enqueued with a 5-minute delay:

```
jobId: expire-payment:<paymentId>
delay: 300000 ms
```

The processor calls `PaymentService.expirePayment(paymentId, orderId)`, which:

1. Runs `payment.updateMany(WHERE status=PENDING AND expiresAt <= now)` — idempotent
2. If another payment for the same order is still PENDING or PAID, does not cancel the order
3. Otherwise, sets order status to CANCELED

**Layer 2 — Recovery cron (every 5 minutes):**
`ExpirePaymentJobService.expirePayments()` processes `PENDING` payments where `expiresAt < now` in batches of 100. Each payment uses the same transactional logic. This catches any jobs lost between Redis restarts or worker crashes.

---

## Caching

### Cache Key Structure

All keys are prefixed with `${APP_NAME}-cache:` and follow the pattern:

```
<APP_NAME>-cache:<domain>:<sub-domain>:<qualifier>...
```

Examples:

```
order-flow-cache:user:id:<userId>
order-flow-cache:user:email:<email>
order-flow-cache:cart:userId:<userId>
order-flow-cache:product:id:<productId>
order-flow-cache:product:list:<search>:<cursor>:<limit>:<status>:<sort>:<sortBy>:<categoryId>
order-flow-cache:coupon:code:<code>
order-flow-cache:auth:refresh:id:<userId>
order-flow-cache:auth:otp:email:<email>
order-flow-cache:auth:otp:resend:<email>
order-flow-cache:llm:product-review:summary:<promptVersion>:<productId>
```

### Cache-Aside Pattern (Standard Resources)

```mermaid
flowchart TD
    A[Request] --> B{Read from Redis}
    B -->|Hit| C[Return cached value]
    B -->|Miss| D[Query PostgreSQL]
    D --> E[Serialize + SET key EX ttl]
    E --> C
```

**Default TTL:** 3600 seconds (1 hour) for most resources. No per-resource override for standard entities — TTL is the `redis.set` default.

**Invalidation:** On any mutation (create, update, delete), the relevant key(s) are explicitly deleted:

```
redis.delete(cartCacheKeyWithUserId(userId))
redis.delete(productCacheKeyWithId(id))
redis.delete(couponCacheKeyWithCode(code))
// etc.
```

There is no write-through caching. There is no cache-level locking or Redlock. Concurrent requests that miss the cache may each hit the database; the last `SET` wins.

### OTP Rate Limiting via Redis SET NX

OTP resend cooldown uses `redis.setIfNotExists(key, "1", 60)` which maps to `SET key 1 EX 60 NX`. If the key already exists (set within the last 60 seconds), the operation returns `false` and the handler returns HTTP 429. The resend key is deleted on failure (OTP hash + resend key) to prevent lock-out if email delivery fails.

### AI Review Summary — Separate Cache Behaviour

```mermaid
flowchart TD
    A["GET /products/:id/review-summary"] --> B{Read Redis\nllm:product-review:summary:v1:<id>}
    B -->|Hit, valid Zod| C[Return cached]
    B -->|Miss or invalid| D{In-flight Map\ninFlight.get(key)?}
    D -->|Promise exists| E[Await existing promise\nshared result]
    D -->|No promise| F[Set inFlight.set(key, promise)]
    F --> G[Load reviews (up to 100) + stats from DB]
    G --> H{totalReviewCount >= 3?}
    H -->|No| I[Cache GENERIC_REVIEW_SUMMARY\nwith SUMMARY_TTL]
    H -->|Yes| J[Build prompt with XML-escaped reviews]
    J --> K[ChatOpenAI.invoke via OpenRouter\nstructured output: ProductReviewSummarySchema]
    K --> L[Cache result EX 43200]
    L --> M[inFlight.delete(key)]
    M --> C
    I --> M
```

**Key differences from standard caching:**

- TTL is 43200 s (12 h) vs 3600 s default
- The key includes `promptVersion` (`v1`) — changing the prompt version auto-invalidates all existing summaries
- In-flight deduplication is in-process only (not distributed); multiple API instances would each make their own LLM call
- Cache read validates against Zod schema; a corrupted/stale entry is treated as a miss
- All LLM errors and DB errors fall back to `GENERIC_REVIEW_SUMMARY` (never throws to the client)
