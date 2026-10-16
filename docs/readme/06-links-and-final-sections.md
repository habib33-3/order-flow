# Phase 7 — Links and Final Sections

## API Reference

The REST API is mounted at:

```
/api/v1
```

Interactive Swagger documentation is available at:

```
/api/docs
```

- **Live API:** https://order-flow-ek0j.onrender.com
- **Live Swagger Docs:** https://order-flow-ek0j.onrender.com/api/docs

### Endpoint Summary

| Domain             | Example Paths                                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication     | `POST /api/v1/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/resend-otp`, `/auth/verify-otp`                                                                          |
| Password           | `POST /api/v1/password/forgot`, `/password/verify-otp`, `/password/reset`, `/password/change`                                                                                                             |
| Users              | `GET /api/v1/user/me`, `PATCH /user/me`, `PUT /user/me/avatar`                                                                                                                                            |
| Products           | `GET /api/v1/products`, `GET /products/:id`, `POST /products` (admin), `PATCH /products/:id` (admin), `POST /products/:id/images`                                                                         |
| Categories         | `GET /api/v1/category`, `GET /category/:id`, `POST /category` (admin)                                                                                                                                     |
| Cart               | `GET /api/v1/cart`, `POST /cart/add-item`, `PATCH /cart/manage`, `DELETE /cart/item/:productId`, `DELETE /cart`                                                                                           |
| Orders             | `POST /api/v1/orders`, `GET /orders` (admin), `GET /orders/me`, `GET /orders/:id`, `PATCH /orders/:id/cancel`, `PATCH /orders/:id/processing`, `PATCH /orders/:id/shipped`, `PATCH /orders/:id/delivered` |
| Shipping Addresses | `GET /api/v1/shipping-address`, `POST /shipping-address`, `GET /shipping-address/:id`, `PATCH /shipping-address/:id`, `DELETE /shipping-address/:id`                                                      |
| Payments           | `POST /api/v1/payments/stripe/webhook`, `GET /payments/bkash/callback`                                                                                                                                    |
| Coupons            | `GET /api/v1/coupon`, `POST /coupon` (admin), `GET /coupon/analytics`                                                                                                                                     |
| Reviews            | `GET /api/v1/review/product/:productId`, `POST /review/product/:productId`, `GET /review/platform`, `POST /review/platform`                                                                               |
| AI Summaries       | `GET /api/v1/product-review-summary/:productId`                                                                                                                                                           |

Most endpoints require a valid access token (`Authorization: Bearer <accessToken>`). Admin-only endpoints additionally require `role: ADMIN` in the JWT payload. The Stripe webhook endpoint bypasses the access token guard. The bKash callback endpoint is also a public route.

See the Swagger documentation for full request and response schemas.

---

## Security

The following security measures are implemented and verified in the codebase:

| Measure                     | Implementation                                                                   |
| --------------------------- | -------------------------------------------------------------------------------- |
| Password hashing            | Argon2 (`argon2.hash` / `argon2.verify`)                                         |
| OTP hashing                 | Argon2 (OTPs are not stored in plaintext)                                        |
| HTTP security headers       | Helmet (`helmet()` in `main.ts`)                                                 |
| JWT signing                 | HS256 with separate secrets for access, refresh, and reset tokens                |
| Refresh token binding       | Token stored in Redis by user ID; replayed tokens rejected                       |
| Input validation            | `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`         |
| Stripe webhook verification | `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`                    |
| Prompt injection mitigation | Review text XML-escape for closing tags; system prompt treats input as untrusted |
| Env validation              | Zod schema at startup; app fails fast on missing/invalid vars                    |
| CORS                        | Enabled globally; origin policy configurable                                     |

---

## Known Limitations

The following are gaps or areas for improvement, documented accurately from the codebase:

1. **Test coverage is minimal.** Two spec files exist (`product-review-summary` module). No integration or end-to-end tests were found. CI does not run tests.

2. **Rate limiting is not applied.** `@nestjs/throttler` is installed but no `@Throttle()` decorators are used anywhere in the application. Auth endpoints (login, register, OTP) are not rate-limited at the application level.

3. **In-flight deduplication for LLM summaries is in-process only.** In a multi-instance deployment, concurrent requests on different instances would each trigger separate LLM calls for the same product. A distributed lock (e.g., Redis SETNX) would be needed for full deduplication across instances.

4. **No POSTGRES_USER / POSTGRES_DB env vars documented for Compose.** The `compose.yml` passes `.env.docker` to the `db` service. The PostgreSQL image expects `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` — these must be set in `.env.docker` even though they are not in `.env.example`.

5. **Container name prefix is `raco-ai-job-task`.** All Compose service containers use this prefix rather than `order-flow`. This is cosmetic and does not affect functionality.

6. **`pnpm` version mismatch between Dockerfile and package.json.** Dockerfile pins pnpm 11.13.1; `package.json` declares `packageManager: pnpm@12.4.2`.

---

## Repository

- **GitHub:** https://github.com/habib33-3/order-flow
- **Issues:** https://github.com/habib33-3/order-flow/issues

## Author

**Habibur Rahman**

## License

This project is licensed under the [MIT License](License).
