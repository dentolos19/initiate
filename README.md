# Initiate

Initiate is a single TanStack Start application deployed as one Cloudflare Worker. The app, API routes, authentication, background jobs, and real-time call integration live in this repository.

## Stack

- TanStack Start and React.
- shadcn/ui and Tailwind CSS.
- Drizzle ORM and PostgreSQL.
- Better Auth with organization support.
- OpenRouter for chat models and embeddings.
- Cloudflare Email Sending, Queues, R2, Vectorize, Workflows, and Durable Objects.
- Cloudflare RealtimeKit for voice and video calls.

## Local Development

1. Copy `.env.template` to `.env` and fill in the required credentials.
2. Start PostgreSQL with `docker compose up -d database`.
3. Install dependencies with `bun install`.
4. Apply the schema with `bun run db:migrate`.
5. Start the app with `bun run dev`.

The local database is available at `postgresql://initiate:initiate@localhost:5432/initiate`. Its files are stored in the ignored `.postgres` directory.

## Cloudflare Setup

The single deployment configuration is in `wrangler.jsonc`; it intentionally has no Wrangler environments or plain-text `vars`. Before deploying, provision resources matching these binding names:

- Queue: `initiate-notifications`.
- Dead-letter queue: `initiate-notifications-dead-letter`.
- R2 bucket: `initiate`, bound as `BUCKET`.
- Vectorize index: `initiate-search`, using 768 dimensions and cosine distance.
- Email Sending binding: `EMAIL`, with `initiate.global` enabled as a sending domain.
- RealtimeKit app and a `group_call_host` preset.
- Hyperdrive configuration referenced by `HYPERDRIVE`.

Set production secrets and configuration through Cloudflare rather than committing `.env`. The local `.env` file is ignored by Git.

Assets use the native R2 binding and are streamed through `/assets/:id`; no separate object-storage credentials are required.

## Database Migrations

Generate migrations with `bun run db:generate` and apply them with `bun run db:migrate`. The provider-consolidation migrations add Better Auth tables and the RealtimeKit message-room relation.

Existing Clerk identities are not automatically portable to Better Auth. Preserve historical ownership by importing users with their existing IDs before enabling sign-in; password credentials and active sessions need a separate reset or migration flow.
