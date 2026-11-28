# 0001. Security Dependency Overrides

- Status: Accepted
- Date: 2026-11-28

## Context

Two transitive dependencies resolve to versions with published advisories. `@tailwindcss/typography` 0.5.20 depends on `postcss-selector-parser` 6.0.10, and versions below 7.1.6 are affected by [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), a quadratic-complexity selector parsing issue. `@cloudflare/realtimekit` depends on `uuid` ^8.3.2, and versions below 11.1.1 are affected by [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq), a missing buffer bounds check.

## Decision

Force `postcss-selector-parser` to 7.1.6 and `uuid` to 11.1.1 through `overrides` in [`package.json`](../../package.json), so every dependent resolves the patched version. Waiting for upstream releases was the alternative.

## Consequences

- `@tailwindcss/typography` and `@cloudflare/realtimekit` run on newer major versions than they declare. Lint, type checks, tests, and the build pass with them.
- Remove each override once its dependents require the patched version or later.
