.PHONY: setup start check build deploy types migrate generate

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

types:
	bun run types

migrate:
	bun run db:migrate

generate:
	bun run db:generate
