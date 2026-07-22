.PHONY: migrate generate db-reset db-seed

migrate: generate
	pnpm exec prisma migrate dev

generate:
	pnpm exec prisma generate

db-reset:
	pnpm exec prisma migrate reset

db-seed:
	pnpm exec prisma db seed