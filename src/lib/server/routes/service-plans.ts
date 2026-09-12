import { and, eq, ne } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";

import { order as orderTable, orderInvoice, servicePlan } from "#/lib/database/schema.js";
import ServiceOrderedUserMail from "#/lib/server/components/service-ordered-user-mail.js";
import { database } from "#/lib/server/integrations/database.js";
import { createPaymentReference, ensurePaymentAccount } from "#/lib/server/lib/payments.js";
import { priceSchema } from "#/lib/server/lib/schema.js";
import { getOrganization, getUser } from "#/lib/server/lib/utils.js";

const servicePlans = new Hono();

function toPriceData(name: string, data: z.infer<typeof priceSchema>) {
  if (data.type === "one_time") return { ...data, nickname: name };
  if (data.type === "recurring" || data.type === "metered") {
    return {
      type: "recurring" as const,
      currency: data.currency,
      nickname: name,
      unit_amount: data.unit_amount,
      recurring: {
        interval: data.interval,
        interval_count: 1,
        usage_type: data.type === "metered" ? "metered" : "licensed",
      },
    };
  }
  return {
    type: "tiered" as const,
    currency: data.currency,
    nickname: name,
    tiers_mode: "volume" as const,
    tiers: data.tiers,
    recurring: { interval: "month" as const, interval_count: 1, usage_type: "licensed" as const },
  };
}

servicePlans.post("/:serviceId/plans", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);
  if (!user || !organization) return c.json({ message: "Unauthorized." }, 401);

  const service = await database.query.service.findFirst({ where: { id: c.req.param("serviceId") } });
  if (!service) return c.json({ message: "Service not found." }, 404);
  if (service.organizationId !== organization.id) return c.json({ message: "Unauthorized." }, 401);

  const parsed = z
    .object({
      name: z.string().min(1),
      status: z.string().optional(),
      description: z.string().optional(),
      default: z.boolean().optional(),
      data: priceSchema,
    })
    .safeParse(await c.req.json());
  if (!parsed.success) return c.json({ message: "Invalid request body." }, 400);

  const priceData = toPriceData(parsed.data.name, parsed.data.data);
  const amount = "unit_amount" in priceData ? priceData.unit_amount : (priceData.tiers[0]?.unit_amount ?? 0);
  const [plan] = await database
    .insert(servicePlan)
    .values({
      serviceId: service.id,
      name: parsed.data.name,
      description: parsed.data.description,
      status: parsed.data.status ?? "active",
      default: parsed.data.default ?? false,
      type: priceData.type,
      currency: priceData.currency,
      amount,
      priceReference: createPaymentReference("price"),
      priceData,
    })
    .returning();

  if (plan.default) {
    await database
      .update(servicePlan)
      .set({ default: false })
      .where(and(eq(servicePlan.serviceId, service.id), ne(servicePlan.id, plan.id)));
  }
  return c.json(plan);
});

servicePlans.get("/:serviceId/plans/:planId", async (c) => {
  const plan = await database.query.servicePlan.findFirst({
    where: { id: c.req.param("planId"), serviceId: c.req.param("serviceId") },
  });
  return plan ? c.json(plan) : c.json({ message: "Service plan not found." }, 404);
});

servicePlans.put("/:serviceId/plans/:planId", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);
  if (!user || !organization) return c.json({ message: "Unauthorized." }, 401);

  const { serviceId, planId } = c.req.param();
  const service = await database.query.service.findFirst({ where: { id: serviceId } });
  const existingPlan = await database.query.servicePlan.findFirst({ where: { id: planId, serviceId } });
  if (!service || !existingPlan) return c.json({ message: "Service plan not found." }, 404);
  if (service.organizationId !== organization.id) return c.json({ message: "Unauthorized." }, 401);

  const parsed = z
    .object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      default: z.boolean().optional(),
      type: z.literal("one_time").optional(),
      currency: z.string().length(3).optional(),
      amount: z.number().positive().optional(),
    })
    .safeParse(await c.req.json());
  if (!parsed.success) return c.json({ message: "Invalid request body." }, 400);

  const currentPrice = existingPlan.priceData as Record<string, unknown> | null;
  const priceData = {
    type: "one_time" as const,
    currency: parsed.data.currency ?? existingPlan.currency,
    nickname: parsed.data.name ?? existingPlan.name,
    unit_amount: parsed.data.amount ? Math.round(parsed.data.amount * 100) : existingPlan.amount,
    ...(currentPrice?.type === "one_time" ? currentPrice : {}),
  };
  priceData.currency = parsed.data.currency ?? existingPlan.currency;
  priceData.nickname = parsed.data.name ?? existingPlan.name;
  priceData.unit_amount = parsed.data.amount ? Math.round(parsed.data.amount * 100) : existingPlan.amount;

  const [plan] = await database
    .update(servicePlan)
    .set({
      name: parsed.data.name,
      description: parsed.data.description,
      status: parsed.data.status,
      default: parsed.data.default,
      type: priceData.type,
      currency: priceData.currency,
      amount: priceData.unit_amount,
      priceData,
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

servicePlans.delete("/:serviceId/plans/:planId", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);
  if (!user || !organization) return c.json({ message: "Unauthorized." }, 401);

  const { serviceId, planId } = c.req.param();
  const service = await database.query.service.findFirst({ where: { id: serviceId } });
  if (!service) return c.json({ message: "Service not found." }, 404);
  if (service.organizationId !== organization.id) return c.json({ message: "Unauthorized." }, 401);

  await database.delete(servicePlan).where(and(eq(servicePlan.id, planId), eq(servicePlan.serviceId, serviceId)));
  return c.json({ message: "Service plan deleted." });
});

servicePlans.post("/:serviceId/plans/:planId/order", async (c) => {
  const { notification } = c.var.integrations;
  const user = await getUser(c);
  if (!user) return c.json({ message: "Unauthorized." }, 401);

  const parsed = z.object({ instructions: z.string().optional() }).safeParse(await c.req.json());
  if (!parsed.success) return c.json({ message: "Invalid request body." }, 400);

  const { serviceId, planId } = c.req.param();
  const service = await database.query.service.findFirst({
    where: { id: serviceId },
    with: { organization: true },
  });
  if (!service?.organization) return c.json({ message: "Service not found." }, 404);

  const plan = await database.query.servicePlan.findFirst({ where: { id: planId, serviceId } });
  if (!plan?.priceData || plan.amount <= 0)
    return c.json({ message: "Service plan does not have a valid price." }, 400);

  const paymentAccountId = await ensurePaymentAccount(service.organization.id, service.organization.paymentAccountId);
  const [order] = await database
    .insert(orderTable)
    .values({
      userId: user.id,
      serviceId: service.id,
      planId: plan.id,
      organizationId: service.organization.id,
      name: `${service.name} — ${plan.name}`,
      description: plan.description,
      instructions: parsed.data.instructions,
      status: "pending",
    })
    .returning();

  const [invoice] = await database
    .insert(orderInvoice)
    .values({
      userId: user.id,
      orderId: order.id,
      paymentAccountId,
      customerReference: createPaymentReference("customer"),
      reference: createPaymentReference("invoice"),
      status: "open",
      currency: plan.currency,
      amount: plan.amount,
      description: `${service.name} — ${plan.name}`,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning();

  await notification.queueNotification([user.id], {
    title: "Service Order Created",
    description: `Your order for "${service.name}" is ready for payment.`,
    content: ServiceOrderedUserMail({
      userName: `${user.firstName} ${user.lastName ?? ""}`.trim(),
      serviceName: service.name,
      serviceProvider: service.organization.name,
      orderDate: new Date().toLocaleDateString(),
      orderNumber: order.id,
      amount: (plan.amount / 100).toFixed(2),
      estimatedCompletion: undefined,
    }),
  });
  await notification.queueNotification([service.organization.id], {
    title: "New Service Order",
    description: `An order was created for "${service.name}".`,
    content: `A new order was created by ${user.firstName} ${user.lastName ?? ""}. The order ID is ${order.id}.`,
  });

  return c.json({ message: "Order created. Complete the payment to continue.", order, invoice });
});

servicePlans.get("/:serviceId/plans", async (c) => {
  const plans = await database.query.servicePlan.findMany({
    where: { serviceId: c.req.param("serviceId") },
    orderBy: { default: "desc" },
  });
  return c.json(plans);
});

export default servicePlans;
