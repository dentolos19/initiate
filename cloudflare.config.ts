import { bindings, defineConfig, defineWorker, exports, triggers } from "cf/config";

import { DATABASE_ID } from "./database.config.ts";
import * as entrypoint from "./src/server.ts" with { type: "cf-worker" };

const workerName = "initiate";

const worker = defineWorker({
  name: workerName,
  compatibilityDate: "2026-10-01",
  entrypoint,
  exports: {
    Messenger: exports.durableObject({ storage: "sqlite" }),
    Synchronizer: exports.workflow({ name: `${workerName}-synchronizer` }),
  },
});

export default defineConfig({
  worker: {
    ...worker,
    observability: {
      logs: { enabled: true },
      traces: { enabled: true },
      issues: { enabled: true },
    },
    domains: ["initiate.dennise.me", "initiate.global"],
    triggers: [
      triggers.queue({
        deadLetterQueue: `${workerName}-notifications-dlq`,
        maxBatchSize: 10,
        maxBatchTimeout: 5,
        maxRetries: 3,
        name: `${workerName}-notifications`,
      }),
    ],
    env: {
      BETTER_AUTH_SECRET: bindings.secret(),
      BETTER_AUTH_URL: bindings.secret(),
      CLOUDFLARE_ACCOUNT_ID: bindings.secret(),
      CLOUDFLARE_API_TOKEN: bindings.secret(),
      ELEVENLABS_AGENT_ID: bindings.secret(),
      ELEVENLABS_API_KEY: bindings.secret(),
      EMAIL_FROM_ADDRESS: bindings.secret(),
      EMAIL_FROM_NAME: bindings.secret(),
      OPENROUTER_API_KEY: bindings.secret(),
      OPENROUTER_EMBEDDING_DIMENSIONS: bindings.secret(),
      OPENROUTER_EMBEDDING_MODEL: bindings.secret(),
      OPENROUTER_MODEL: bindings.secret(),
      OPENROUTER_REFERER: bindings.secret(),
      OPENROUTER_TITLE: bindings.secret(),
      REALTIMEKIT_APP_ID: bindings.secret(),
      DB: bindings.d1({ name: workerName, id: DATABASE_ID }),
      BUCKET: bindings.r2({ name: workerName }),
      VECTORIZE: bindings.vectorize({ name: `${workerName}-search` }),
      EMAIL: bindings.sendEmail({ dev: { remote: true } }),
      NOTIFICATIONS: bindings.queue({ name: `${workerName}-notifications` }),
      MESSENGER: bindings.durableObject<typeof worker, "Messenger">({ worker, exportName: "Messenger" }),
      SYNCHRONIZER: bindings.workflow<typeof worker, "Synchronizer">({
        name: `${workerName}-synchronizer`,
        worker,
        exportName: "Synchronizer",
      }),
    },
  },
});
