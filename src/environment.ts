export const ENVIRONMENT = (import.meta.env.VITE_ENVIRONMENT || "development") as "production" | "development";
export const BACKEND_URL = "/api";

// Stripe (Payments)
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;
