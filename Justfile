setup:
    bun install
    just migrate

start:
    bun run dev

check:
    bun run check

migrate *args:
    bun run db:migrate {{ args }}
