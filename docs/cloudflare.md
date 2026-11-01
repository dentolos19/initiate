# Cloudflare development

The app uses the beta `cf` CLI and Cloudflare Vite plugin with `cloudflare.config.ts`. `just check` uses Bun's linter, formatter, and type checker; `bunfig.toml` configures import, package, and Tailwind sorting.

`just setup` installs dependencies and applies the local D1 migrations. `just start` serves the app on port 3000. The Vite plugin and `just migrate` share `.wrangler/state`, preserving the existing local D1 and Durable Object data. `just migrate --remote` applies the existing Drizzle migrations to the configured D1 database.

`just deploy` installs and builds the Worker, applies remote D1 migrations, then uploads the prebuilt application with secrets from `.env`. A failed migration stops deployment. Use `just environment=production deploy` to select `.env.production`. The selected file takes precedence over inherited values and all of its keys are uploaded as Worker secrets. Selecting a file changes configuration values but still targets the same Worker. The CI deployment creates `.env` from the Production environment and runs the same `just deploy` recipe without a separate migration step.

Unlike the other Worker projects, Initiate's RealtimeKit integration needs `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` inside the deployed Worker to call the Cloudflare API. Include these credentials in the selected app environment file as well as the deployment process environment.
