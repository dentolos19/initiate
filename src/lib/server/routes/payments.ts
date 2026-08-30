import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { organization as organizationTable } from "#/lib/database/schema.js";
import { PLATFORM_URL } from "#/lib/server/environment.js";
import { stripe } from "#/lib/server/integrations.js";
import { database } from "#/lib/server/integrations/database.js";
import { checkMembership, getOrganization, getUser } from "#/lib/server/lib/utils.js";

const payments = new Hono();

// Get current organization's Stripe Connect account
payments.get("/connect", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);
  const authorized = !!user && !!organization && (await checkMembership(user.id, organization.id));

  if (!authorized) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  const createAccount = async () => {
    const account = await stripe.accounts.create({
      metadata: {
        organizationId: organization.id,
      },
      controller: {
        stripe_dashboard: {
          type: "express",
        },
        fees: {
          payer: "application",
        },
        losses: {
          payments: "application",
        },
      },
    });

    await database
      .update(organizationTable)
      .set({ stripeAccountId: account.id })
      .where(eq(organizationTable.id, organization.id));

    return account;
  };

  if (!organization.stripeAccountId) {
    const account = await createAccount();
    return c.json(account);
  } else {
    let account = await stripe.accounts.retrieve(organization.stripeAccountId);
    if (!account) account = await createAccount();
    return c.json(account);
  }
});

// Create link for onboarding Stripe Connect account
payments.get("/connect/onboard", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);
  const authorized = !!user && !!organization && (await checkMembership(user.id, organization.id));

  if (!authorized) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  if (!organization.stripeAccountId) {
    return c.json({ error: "No Stripe account linked." }, 400);
  }

  const link = await stripe.accountLinks.create({
    type: "account_onboarding",
    account: organization.stripeAccountId,
    return_url: `${PLATFORM_URL}/manage/organization`,
    refresh_url: `${PLATFORM_URL}/manage/organization`,
  });

  return c.json(link);
});

// Create link for accessing Stripe Connect account
payments.get("/connect/access", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);
  const authorized = !!user && !!organization && (await checkMembership(user.id, organization.id));

  if (!authorized) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  if (!organization.stripeAccountId) {
    return c.json({ error: "No Stripe account linked." }, 400);
  }

  const link = await stripe.accounts.createLoginLink(organization.stripeAccountId);

  return c.json(link);
});

// Generate a session for Stripe account
payments.get("/connect/session", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);
  const authorized = !!user && !!organization && (await checkMembership(user.id, organization.id));

  if (!authorized) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  if (!organization.stripeAccountId) {
    return c.json({ error: "No Stripe account linked." }, 400);
  }

  const session = await stripe.accountSessions.create({
    account: organization.stripeAccountId,
    components: {
      account_onboarding: { enabled: true },
      account_management: { enabled: true },
    },
  });

  return c.json(session);
});

export default payments;
