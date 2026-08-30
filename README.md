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
2. Install dependencies with `make setup`.
3. Start PostgreSQL and the app with `make start`.
4. Apply the schema with `make migrate`.

The local database is available at `postgresql://initiate:initiate@localhost:5432/initiate`. Its files are stored in the ignored `.postgres` directory.

## Cloudflare Setup

The single deployment configuration is in `wrangler.jsonc`; it intentionally has no Wrangler environments or plain-text `vars`. Before deploying, provision resources matching these binding names:

- Queue: `initiate-notifications`.
- Dead-letter queue: `initiate-notifications-dead-letter`.
- R2 bucket: `initiate`, bound as `BUCKET`.
- Vectorize index: `initiate-search`, using 768 dimensions and cosine distance.
- Email Sending binding: `EMAIL`, with `dennise.me` enabled as the sending domain for `apps@dennise.me`.
- RealtimeKit app and a `group_call_host` preset.
- Hyperdrive configuration referenced by `HYPERDRIVE`.

Create the resources that Wrangler does not provision automatically before the first deployment:

```sh
bunx wrangler queues create initiate-notifications
bunx wrangler queues create initiate-notifications-dead-letter
bunx wrangler vectorize create initiate-search --dimensions=768 --metric=cosine
```

The current Worker bundle is larger than the 3 MB compressed limit on Workers Free. Use a Workers Paid plan, which allows compressed Worker bundles up to 10 MB.

Set production secrets and configuration through Cloudflare rather than committing `.env`. The local `.env` file is ignored by Git. Wrangler checks the required secret names declared in `wrangler.jsonc` during local development.

Assets use the native R2 binding and are streamed through `/assets/:id`; no separate object-storage credentials are required.

## Deployment

The GitHub workflow builds the app, applies PostgreSQL migrations, and deploys the Worker with the maintained Cloudflare action. GitHub keeps sensitive values in Secrets and non-sensitive values in Variables; the action uploads both groups as encrypted Worker secrets. It runs on pushes to `main` and through manual dispatch.

Create a GitHub environment named `Production` and add these secrets:

- `BETTER_AUTH_SECRET`.
- `CLOUDFLARE_API_TOKEN`.
- `DATABASE_URL`.
- `ELEVENLABS_API_KEY`.
- `OPENROUTER_API_KEY`.
- `STRIPE_SECRET_KEY`.
- `STRIPE_WEBHOOK_SECRET`.

The repository-level `CLOUDFLARE_API_TOKEN` secret remains available to the deployment job. Add it to the `Production` environment as well when you rotate or replace that token.

Add these variables to the same GitHub environment:

- `BETTER_AUTH_URL`.
- `CLOUDFLARE_ACCOUNT_ID`.
- `EMAIL_FROM_ADDRESS`.
- `EMAIL_FROM_NAME`.
- `ELEVENLABS_AGENT_ID`.
- `ENVIRONMENT`.
- `OPENROUTER_EMBEDDING_DIMENSIONS`.
- `OPENROUTER_EMBEDDING_MODEL`.
- `OPENROUTER_MODEL`.
- `OPENROUTER_REFERER`.
- `OPENROUTER_TITLE`.
- `PLATFORM_URL`.
- `REALTIMEKIT_APP_ID`.
- `REALTIMEKIT_PRESET_NAME`.
- `STRIPE_PUBLISHABLE_KEY`.

For a local release, authenticate Wrangler and run `make deploy`. This builds the app before deployment and preserves secrets already stored on the Worker.

## Database Migrations

Generate migrations with `bun run db:generate` and apply them with `bun run db:migrate`. The provider-consolidation migrations add Better Auth tables and the RealtimeKit message-room relation.

Existing Clerk identities are not automatically portable to Better Auth. Preserve historical ownership by importing users with their existing IDs before enabling sign-in; password credentials and active sessions need a separate reset or migration flow.
