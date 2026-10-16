# Phase 8 — Final Review

## Cross-Check Results

### Commands Verified Against package.json

| README Command                                       | In package.json                            | Correct |
| ---------------------------------------------------- | ------------------------------------------ | ------- |
| `pnpm install`                                       | via pnpm itself                            | ✓       |
| `pnpm start:dev`                                     | `"start:dev": "nest start --watch"`        | ✓       |
| `pnpm build`                                         | `"build": "nest build"`                    | ✓       |
| `pnpm start:prod`                                    | `"start:prod": "node dist/src/main"`       | ✓       |
| `pnpm lint`                                          | `"lint": "eslint ..."`                     | ✓       |
| `pnpm lint:fix`                                      | `"lint:fix": "eslint ... --fix"`           | ✓       |
| `pnpm format`                                        | `"format": "prettier --write ..."`         | ✓       |
| `pnpm test`                                          | `"test": "jest"`                           | ✓       |
| `pnpm test:cov`                                      | `"test:cov": "jest --coverage"`            | ✓       |
| `pnpm prisma migrate dev`                            | (pnpm exec, not a script)                  | ✓       |
| `pnpm prisma migrate deploy`                         | (pnpm exec)                                | ✓       |
| `pnpm prisma db seed`                                | `"prisma": {"seed": "tsx prisma/seed.ts"}` | ✓       |
| `pnpm seed`                                          | `"seed": "tsx prisma/seed.ts"`             | ✓       |
| `docker compose up --build`                          | verified via compose.yml                   | ✓       |
| `docker compose exec app pnpm prisma migrate deploy` | ✓                                          |
| `docker compose down`                                | ✓                                          |
| `docker compose down -v`                             | ✓                                          |

### Environment Variables Verified Against env.ts

All variables in the README env table were verified against `src/common/env/env.ts`:

- All `z.string()` without `.optional()` → **Required**
- `NODE_ENV`, `PORT`, `CLIENT_URL`, `APP_NAME`, `ACCESS_TOKEN_EXPIRES`, `REFRESH_TOKEN_EXPIRES`, `SHOW_BULL_BOARD` have `.default()` → **Optional**
- `STRIPE_PUBLIC_KEY` is in `.env.example` but NOT in `envSchema` → correctly noted as not required server-side

### Diagrams Validated

- System architecture: all components exist (verified module imports in app.module.ts)
- ER diagram: all models and fields verified against individual `.prisma` files; note that the `Order` model includes `subtotal`, `discountAmount`, `couponCode` fields confirmed via migration SQL
- Auth sequence diagrams: logic verified line-by-line against `auth.service.ts`
- Order creation: verified against `create-order.service.ts` and `orders.service.ts`
- Payment lifecycle: verified against `payment.service.ts`, `stripe-webhook.service.ts`, `bkash-callback.service.ts`
- Caching flows: verified against `cart.service.ts`, `redis.service.ts`, `cache-key.ts`
- AI summary flow: verified against `product-review-summary.service.ts` and `product-review-summary.constants.ts`

### Badge URLs Verified Against Workflow Files

| Badge              | Workflow File                        | Branch | Correct |
| ------------------ | ------------------------------------ | ------ | ------- |
| `build-push.yml`   | `.github/workflows/build-push.yml`   | main   | ✓       |
| `db-migration.yml` | `.github/workflows/db-migration.yml` | main   | ✓       |

### Internal Links

- `[MIT License](License)` — `License` file exists at root ✓
- Live API URL: `https://order-flow-ek0j.onrender.com` — sourced from existing README ✓

### Local vs Docker Consistency

| Aspect       | Local                     | Docker                                               |
| ------------ | ------------------------- | ---------------------------------------------------- |
| Port         | 5000                      | 5000 (mapped 5000:5000)                              |
| API prefix   | /api/v1                   | /api/v1                                              |
| Swagger path | /api/docs                 | /api/docs                                            |
| Migrations   | `pnpm prisma migrate dev` | `docker compose exec app pnpm prisma migrate deploy` |
| Seeding      | `pnpm prisma db seed`     | `docker compose exec app pnpm prisma db seed`        |

### Facts Without Repository Evidence (Omitted)

- Test coverage percentage — not measurable (minimal test suite)
- Production uptime or reliability metrics — not in codebase
- Rate limiting behavior — `@nestjs/throttler` installed but not applied; omitted from README

## Assembly Checklist

- [x] All phase documents written
- [x] All commands verified against package.json
- [x] All env vars verified against env.ts
- [x] All Mermaid diagrams use only verified components
- [x] ER diagram fields match prisma schema files
- [x] Badge URLs match actual workflow filenames
- [x] No secrets or real values documented
- [x] Known limitations documented accurately
- [x] Final README assembled (see README.md at repo root)

## Final Status

**COMPLETED** — All phases written, verified, and assembled into `README.md`.
