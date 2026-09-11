.PHONY: setup start check migrate

setup:
	bun install
	$(MAKE) migrate

start:
	bun run dev

check:
	bun run check

migrate:
	bun run db:migrate
