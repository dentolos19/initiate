.PHONY: setup start check build deploy migrate
.PHONY: start-app start-database stop generate studio

setup:
	bun install

start: start-database
	$(MAKE) start-app

check:
	bun run check

build:
	bun run build

deploy:
	bun run deploy

migrate:
	bun run db:migrate

start-app:
	bun run dev

start-database:
	docker compose up -d database

stop:
	docker compose down

generate:
	bun run db:generate

studio:
	bun run db:studio
