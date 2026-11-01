import type { Context } from "hono";

import { getAuth } from "#/lib/server/integrations/auth.js";
import { database } from "#/lib/server/integrations/database.js";

type OrderParties = {
  userId: string | null;
  organizationId: string | null;
};

type OrderUser = {
  id: string;
  type: string;
};

export type OrderAccess = {
  admin: boolean;
  buyer: boolean;
  provider: boolean;
};

export async function resolveOrderAccess(
  order: OrderParties,
  user: OrderUser,
  isMember: (userId: string, organizationId: string) => Promise<boolean>,
): Promise<OrderAccess> {
  return {
    admin: user.type === "admin",
    buyer: order.userId === user.id,
    provider: order.organizationId ? await isMember(user.id, order.organizationId) : false,
  };
}

export async function getOrderAccess(context: Context, orderId: string) {
  const userId = getAuth(context).userId;
  if (!userId) return null;
  const user = await database.query.user.findFirst({
    where: { id: userId },
    columns: { id: true, type: true },
  });
  if (!user) return null;

  const order = await database.query.order.findFirst({
    where: { id: orderId },
    columns: { id: true, userId: true, organizationId: true, status: true },
  });
  if (!order) return null;

  const access = await resolveOrderAccess(order, user, async (memberId, organizationId) =>
    Boolean(await database.query.authMember.findFirst({ where: { userId: memberId, organizationId } })),
  );
  if (!access.admin && !access.buyer && !access.provider) return null;
  return { access, order };
}

export function canChangeOrderStatus(access: OrderAccess, from: string, to: string) {
  if (access.admin) return true;

  switch (to) {
    case "proposed":
      return access.provider && (from === "draft" || from === "rejected");
    case "confirmed":
      return (access.buyer && from === "proposed") || (access.provider && from === "pending");
    case "rejected":
      return access.buyer && from === "proposed";
    case "completed":
      return access.provider && from === "confirmed";
    case "cancelled":
      return (
        (access.provider && ["draft", "pending", "confirmed", "rejected"].includes(from)) ||
        (access.buyer && ["pending", "confirmed"].includes(from))
      );
    default:
      return false;
  }
}
