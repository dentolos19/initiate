.PHONY: build check deploy generate migrate migrate-remote setup start

setup:
	bun install

start:
	bun run dev

check:
	bun run check

build:
	bun run build

deploy:
	bun run deploy

migrate:
	bun run db:migrate

migrate-remote:
	bun run db:migrate:remote

generate:
	bun run db:generate
