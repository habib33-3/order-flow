FROM node:24-alpine AS base

WORKDIR /app

ENV HUSKY=0

RUN corepack enable \
    && corepack prepare pnpm@11.13.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

FROM base AS deps

RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS builder

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY . .

RUN pnpm prisma generate
RUN pnpm build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable \
    && corepack prepare pnpm@11.13.1 --activate

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 5000

CMD ["pnpm", "start:prod"]