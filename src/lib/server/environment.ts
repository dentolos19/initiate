import "dotenv/config";

export const ENVIRONMENT = (process.env.ENVIRONMENT || "development") as "production" | "development";
export const PLATFORM_URL = process.env.PLATFORM_URL || "http://localhost:3000";

// Neon (Postgres Database)
export const DATABASE_URL = process.env.DATABASE_URL as string;

// Better Auth
export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET as string;
export const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || PLATFORM_URL;

// Stripe (Payments)
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY as string;

// Cloudflare RealtimeKit
export const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID as string;
export const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN as string;
export const REALTIMEKIT_APP_ID = process.env.REALTIMEKIT_APP_ID as string;
export const REALTIMEKIT_PRESET_NAME = process.env.REALTIMEKIT_PRESET_NAME || "group_call_host";

// ElevenLabs (Voice AI)
export const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY as string;
export const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID as string;

// Webhooks
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

// OpenRouter
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY as string;
export const OPENROUTER_EMBEDDING_DIMENSIONS = Number(process.env.OPENROUTER_EMBEDDING_DIMENSIONS || 768);
export const OPENROUTER_EMBEDDING_MODEL = process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/auto";
export const OPENROUTER_REFERER = process.env.OPENROUTER_REFERER || PLATFORM_URL;
export const OPENROUTER_TITLE = process.env.OPENROUTER_TITLE || "Initiate";

// Email Sending
export const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || "apps@dennise.me";
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Initiate";
