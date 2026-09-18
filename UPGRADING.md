# Dependency Upgrade

## October 15, 2026

The application uses TanStack Start 1.169.2, React 19.3.1, Vite 8.3.4, and the latest stable versions selected in `package.json`.

### Better Auth

Better Auth 1.7.8 no longer writes the `auth_accounts.issuer` field added by 1.7.0 through 1.7.2. The new migration removes its unique index and obsolete column, preserving account IDs, provider IDs, users, and password hashes. Run `just migrate --remote` through the existing deployment workflow after deploying. Local development uses `just migrate --local`. Do not reset the database.

The migration is tested against an in-memory SQLite database with an existing credential account and a new account insert. Follow the [Better Auth upgrade guide](https://better-auth.com/docs/guides/1-7-upgrade-guide) for other deployments.

### UI And Chat

ElevenLabs hooks now run inside `ConversationProvider`. AI SDK 7 uses UI message parts and the UI message streaming protocol on both client and server. Form input state stays in the existing shared hook. TipTap 3 content synchronization explicitly suppresses update events to prevent controlled-editor feedback loops. Calendar, chart, and resizable components use their current APIs.

Run `just check`, `just build`, and `just test` before deployment. The new schema migration is generated but has not been applied to production.
