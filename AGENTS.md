# Agent Instructions

Initiate is an AI-assisted marketplace and collaboration platform where small and medium-sized enterprises find, compare, buy, and manage AI and digital services from solution providers.

## Commands

- `just setup`: Install dependencies and apply local database migrations.
- `just start`: Start the development server on port 3000.
- `just check`: Lint, format, and type check.
- `just test`: Run the test suite.
- `just build`: Build the Worker and static assets.
- `just migrate`: Apply Drizzle migrations locally. Pass `--remote` for production.
- `just deploy`: Build, migrate production, and deploy with secrets from `.env`. Set `environment=production` to use `.env.production`.

## Stack

TanStack Start with React 19 and Hono on Cloudflare Workers (D1, R2, Vectorize, Queues, Durable Objects, Workflows, and RealtimeKit) through the `cf` CLI, with Drizzle, Better Auth, the AI SDK with OpenRouter, shadcn/ui on Radix UI, Tailwind CSS 4, and Bun.

## Documentation

- [Product Specifications](PRODUCT.md)
- [Design System](DESIGN.md)
- [Documentation Guidelines](docs/README.md)
- [Cloudflare Development](docs/guides/cloudflare.md)
