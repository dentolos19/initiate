set dotenv-load

setup: install
    just migrate

install:
    bun install --frozen-lockfile

start:
    bun run dev

build:
    bun run build

check:
    bun run check

migrate *args:
    bun run db:migrate {{ args }}

deploy: install build
    #!/usr/bin/env bash
    set -euo pipefail
    names=(
        BETTER_AUTH_SECRET
        BETTER_AUTH_URL
        ELEVENLABS_AGENT_ID
        ELEVENLABS_API_KEY
        EMAIL_FROM_ADDRESS
        EMAIL_FROM_NAME
        OPENROUTER_API_KEY
        OPENROUTER_EMBEDDING_DIMENSIONS
        OPENROUTER_EMBEDDING_MODEL
        OPENROUTER_MODEL
        OPENROUTER_REFERER
        OPENROUTER_TITLE
        REALTIMEKIT_APP_ID
    )
    for name in "${names[@]}"; do if [[ -z "${!name:-}" ]]; then echo "Missing worker secret value: $name" >&2; exit 1; fi; done
    node -e 'process.stdout.write(JSON.stringify(Object.fromEntries(process.argv.slice(1).map((name) => [name, process.env[name]]))))' "${names[@]}" | bun wrangler secret bulk
    bun wrangler deploy
