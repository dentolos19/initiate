import { and, eq, ne } from "drizzle-orm";
import { Hono } from "hono";
import type Stripe from "stripe";
import z from "zod";

import { order as orderTable, servicePlan } from "#/lib/database/schema.js";
import ServiceOrderedUserMail from "#/lib/server/components/service-ordered-user-mail.js";
import { stripe } from "#/lib/server/integrations.js";
import { database } from "#/lib/server/integrations/database.js";
import { priceSchema } from "#/lib/server/lib/schema.js";
import { getCustomer, getOrganization, getUser } from "#/lib/server/lib/utils.js";
import { attachInvoice } from "#/lib/server/lib/utils/finances.js";

const servicePlans = new Hono();

// Create a service plan of a service
servicePlans.post("/:serviceId/plans", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);

  if (!user || !organization) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  if (!organization?.stripeAccountId) {
    return c.json({ message: "Organization does not have a Stripe account." }, 400);
  }

  const serviceId = c.req.param("serviceId");
  const requestBody = await c.req.json();

  const service = await database.query.service.findFirst({
    where: {
      id: serviceId,
    },
    columns: {
      id: true,
      organizationId: true,
      stripeProductId: true,
    },
  });

  if (!service) {
    return c.json({ message: "Service not found." }, 404);
  }

  if (service.organizationId !== organization.id) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const { success, data } = z
    .object({
      name: z.string(),
      type: z.string().optional(),
      status: z.string().optional(),
      description: z.string().optional(),
      default: z.boolean().optional(),
      data: priceSchema.optional(),
    })
    .safeParse(requestBody);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  const body = data.data;

  let price: Stripe.Price | undefined;

  if (body && service.stripeProductId) {
    switch (body.type) {
      case "one_time":
        price = await stripe.prices.create(
          {
            product: service.stripeProductId,
            nickname: data.name,
            currency: body.currency,
            unit_amount: body.unit_amount,
          },
          { stripeAccount: organization.stripeAccountId },
        );
        break;
      // case "recurring":
      //   price = await stripe.prices.create(
      //     {
      //       product: service.stripeProductId,
      //       nickname: data.name,
      //       currency: body.currency,
      //       unit_amount: body.unit_amount,
      //       recurring: {
      //         interval: body.interval,
      //       },
      //     },
      //     { stripeAccount: organization.stripeAccountId },
      //   );
      //   break;
      // case "tiered":
      //   price = await stripe.prices.create(
      //     {
      //       product: service.stripeProductId,
      //       nickname: data.name,
      //       currency: body.currency,
      //       tiers_mode: "volume",
      //       billing_scheme: "tiered",
      //       tiers: body.tiers.map((tier) => ({
      //         up_to: tier.up_to,
      //         unit_amount: tier.unit_amount,
      //       })),
      //     },
      //     { stripeAccount: organization.stripeAccountId },
      //   );
      //   break;
      // case "metered":
      //   price = await stripe.prices.create(
      //     {
      //       product: service.stripeProductId,
      //       nickname: data.name,
      //       currency: body.currency,
      //       unit_amount: body.unit_amount,
      //       recurring: {
      //         interval: body.interval,
      //         usage_type: "metered",
      //       },
      //     },
      //     { stripeAccount: organization.stripeAccountId },
      //   );
      //   break;
    }
  }

  const [plan] = await database
    .insert(servicePlan)
    .values({
      serviceId: service.id,
      name: data.name,
      description: data.description,
      status: data.status || "active",
      default: data.default || false,
      currency: price?.currency,
      amount: price?.unit_amount || 0,
      stripePriceId: price?.id,
      stripePriceData: price,
    })
    .returning();

  if (plan.default) {
    await database
      .update(servicePlan)
      .set({ default: false })
      .where(and(eq(servicePlan.serviceId, serviceId), ne(servicePlan.id, plan.id)));
  }

  return c.json(plan);
});

// Get a service plan of a service
servicePlans.get("/:serviceId/plans/:planId", async (c) => {
  const serviceId = c.req.param("serviceId");
  const planId = c.req.param("planId");

  const plan = await database.query.servicePlan.findFirst({
    where: {
      id: planId,
      serviceId: serviceId,
    },
  });

  if (!plan) {
    return c.json({ message: "Service plan not found." }, 404);
  }

  return c.json(plan);
});

// Update a service plan of a service
servicePlans.put("/:serviceId/plans/:planId", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);

  if (!user || !organization) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  if (!organization.stripeAccountId) {
    return c.json({ message: "Organization does not have a Stripe account." }, 400);
  }

  const serviceId = c.req.param("serviceId");
  const planId = c.req.param("planId");
  const requestBody = await c.req.json();

  const service = await database.query.service.findFirst({
    where: {
      id: serviceId,
    },
    columns: {
      id: true,
      organizationId: true,
      stripeProductId: true,
    },
  });

  if (!service) {
    return c.json({ message: "Service not found." }, 404);
  }

  if (service.organizationId !== organization.id) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const existingPlan = await database.query.servicePlan.findFirst({
    where: {
      id: planId,
      serviceId: serviceId,
    },
    columns: {
      id: true,
      stripePriceId: true,
    },
  });

  if (!existingPlan) {
    return c.json({ message: "Service plan not found." }, 404);
  }

  const { success, data } = z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      default: z.boolean().optional(),
    })
    .safeParse(requestBody);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  let price: Stripe.Price | undefined;

  if (existingPlan.stripePriceId) {
    price = await stripe.prices.update(
      existingPlan.stripePriceId,
      {
        nickname: data.name,
      },
      {
        stripeAccount: organization.stripeAccountId,
      },
    );
  }

  const [plan] = await database
    .update(servicePlan)
    .set({
      name: data.name,
      description: data.description,
      status: data.status,
      default: data.default,
      currency: price?.currency,
      amount: price?.unit_amount || 0,
      stripePriceId: price?.id,
      stripePriceData: price,
    })
    .where(eq(servicePlan.id, planId))
    .returning();

  if (plan.default) {
    await database
      .update(servicePlan)
      .set({ default: false })
      .where(and(eq(servicePlan.serviceId, serviceId), ne(servicePlan.id, planId)));
  }

  return c.json(plan);
});

// Delete service plan of a service
servicePlans.delete("/:serviceId/plans/:planId", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);

  if (!user || !organization) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  if (!organization.stripeAccountId) {
    return c.json({ message: "Organization does not have a Stripe account." }, 400);
  }

  const serviceId = c.req.param("serviceId");
  const planId = c.req.param("planId");

  const service = await database.query.service.findFirst({
    where: {
      id: serviceId,
    },
  });

  if (!service) {
    return c.json({ message: "Service not found." }, 404);
  }

  if (service.organizationId !== organization.id) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const existingPlan = await database.query.servicePlan.findFirst({
    where: {
      id: planId,
      serviceId: serviceId,
    },
    columns: {
      id: true,
      stripePriceId: true,
    },
  });

  if (!existingPlan) {
    return c.json({ message: "Service plan not found." }, 404);
  }

  if (existingPlan.stripePriceId) {
    await stripe.prices.update(
      existingPlan.stripePriceId,
      {
        active: false,
      },
      {
        stripeAccount: organization.stripeAccountId,
      },
    );
  }

  await database.delete(servicePlan).where(eq(servicePlan.id, planId));

  return c.json({ message: "Service plan deleted." });
});

// Order a service plan of a service
servicePlans.post("/:serviceId/plans/:planId/order", async (c) => {
  const { notification } = c.var.integrations;

  const user = await getUser(c);

  if (!user) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const body = await c.req.json();

  const { success, data } = z
    .object({
      instructions: z.string().optional(),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  const { serviceId, planId } = c.req.param();

  const service = await database.query.service.findFirst({
    where: {
      id: serviceId,
    },
    with: {
      organization: {
        columns: {
          id: true,
          name: true,
          stripeAccountId: true,
        },
      },
    },
  });

  if (!service) {
    return c.json({ message: "Service not found." }, 404);
  }

  if (!service.organization) {
    return c.json({ message: "Service organization not found." }, 404);
  }

  const plan = await database.query.servicePlan.findFirst({
    where: {
      id: planId,
      serviceId: service.id,
    },
  });

  if (!plan) {
    return c.json({ message: "Service plan not found." }, 404);
  }

  if (!plan.stripePriceId) {
    return c.json({ message: "Service plan does not have a Stripe price." }, 400);
  }

  const price = await stripe.prices.retrieve(plan.stripePriceId, {
    stripeAccount: service.organization.stripeAccountId!,
  });

  const customer = await getCustomer(user.id, service.organization.stripeAccountId!);

  const [order] = await database
    .insert(orderTable)
    .values({
      userId: user.id,
      serviceId: service.id,
      planId: plan.id,
      organizationId: service.organization.id, // Assign the organization from the service
      description: plan.description,
      instructions: data.instructions,
      status: "pending",
    })
    .returning();

  await attachInvoice(
    {
      orderId: order.id,
      userId: user.id,
      accountId: service.organization.stripeAccountId!,
      customerId: customer.id,
      serviceName: service.name,
      servicePlan: plan.name,
    },
    {
      currency: price.currency,
      amount: price.unit_amount || 0,
    },
  );

  // TODO: Improve notification system

  // Send notification to user
  await notification.queueNotification([user.id], {
    title: "Service Order Created",
    description: `Your order for the service "${service.name}" has been created successfully.`,
    content: ServiceOrderedUserMail({
      userName: `${user.firstName} ${user.lastName}`,
      serviceName: service.name,
      serviceProvider: service.organization.name,
      orderDate: new Date().toLocaleDateString(),
      orderNumber: order.id,
      amount: ((price.unit_amount || 0) / 100).toFixed(2),
      estimatedCompletion: undefined, // Can be added if available
    }),
  });

  // Send notification to organization
  await notification.queueNotification([service.organization.id], {
    title: "New Service Order",
    description: `A new service order has been created for the service "${service.name}".`,
    content: `A new service order has been created by ${user.firstName} ${user.lastName} for the service "${service.name}". The order ID is ${order.id}.`,
  });

  return c.json({ message: "Service order created successfully.", order });
});

// Get all service plans of service
servicePlans.get("/:serviceId/plans", async (c) => {
  const serviceId = c.req.param("serviceId");

  const plans = await database.query.servicePlan.findMany({
    where: {
      serviceId: serviceId,
    },
    orderBy: {
      default: "desc",
    },
  });

  return c.json(plans);
});

export default servicePlans;
