import Stripe from "stripe";

import { STRIPE_SECRET_KEY } from "#/lib/server/environment.js";

let client: Stripe | undefined;

function getStripe() {
  const apiKey = STRIPE_SECRET_KEY?.trim();

  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY must be configured before using Stripe payments.");
  }

  client ??= new Stripe(apiKey, { httpClient: Stripe.createFetchHttpClient() });
  return client;
}

const stripe = new Proxy({} as Stripe, {
  get(_target, property) {
    const client = getStripe();
    const value = Reflect.get(client, property, client);

    return typeof value === "function" ? value.bind(client) : value;
  },
});

export { getStripe, stripe };
