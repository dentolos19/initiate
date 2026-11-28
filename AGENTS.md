# Agent Instructions

Initiate is an AI-assisted marketplace and collaboration platform where small and medium-sized enterprises find, compare, buy, and manage AI and digital services from solution providers. It runs as a single Cloudflare Worker at [initiate.dennise.me](https://initiate.dennise.me).

## Commands

- `just setup`: Install dependencies and apply local database migrations.
- `just install`: Install dependencies from the frozen lockfile.
- `just start`: Start the development server on port 3000.
- `just build`: Build the Worker and static assets.
- `just check`: Lint, format, and type check.
- `just test`: Run the test suite.
- `just migrate`: Apply Drizzle migrations locally. Pass `--remote` for production.
- `just deploy`: Build, migrate production, and deploy with secrets from `.env`. Set `environment=production` to use `.env.production`.

## Stack

TanStack Start with React 19 and Hono on Cloudflare Workers (D1, R2, Vectorize, Queues, Durable Objects, Workflows, and RealtimeKit) through the `cf` CLI, with Drizzle, Better Auth, the AI SDK with OpenRouter, shadcn/ui on Radix UI, Tailwind CSS 4, and Bun.

## Rules

- Keep `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in the deployment workflow's secrets step. RealtimeKit reads them inside the Worker, but they stay out of `.env.template`; see [Cloudflare Development](docs/guides/cloudflare.md).

## Documentation

- [Product Specifications](PRODUCT.md)
- [Design System](DESIGN.md)
- [Documentation Guidelines](docs/README.md)
- [Cloudflare Development](docs/guides/cloudflare.md)
