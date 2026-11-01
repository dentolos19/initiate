set dotenv-load
set dotenv-filename := dotenv_file
set dotenv-override

environment := ""
dotenv_file := if environment == "" { ".env" } else { ".env." + environment }

setup: install
    just environment={{ quote(environment) }} migrate

install:
    bun install --frozen-lockfile

start:
    bun run dev

build:
    bun run build

check:
    bun lint --fix && bun fmt && bun check --no-script

test:
    bun test

migrate *args:
    bun run db:migrate {{ args }}

deploy: install build
    #!/usr/bin/env bash
    set -euo pipefail
    test -f {{ quote(dotenv_file) }}
    just environment={{ quote(environment) }} migrate --remote
    bun run deploy --prebuilt --secrets-file {{ quote(dotenv_file) }}
