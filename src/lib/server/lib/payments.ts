import { eq } from "drizzle-orm";

import { organization as organizationTable } from "#/lib/database/schema.js";
import { database } from "#/lib/server/integrations/database.js";

export function createPaymentReference(prefix: "account" | "customer" | "invoice" | "price" | "product") {
  return `demo_${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

export async function ensurePaymentAccount(organizationId: string, paymentAccountId?: string | null) {
  if (paymentAccountId) return paymentAccountId;

  const id = createPaymentReference("account");
  await database
    .update(organizationTable)
    .set({ paymentAccountId: id })
    .where(eq(organizationTable.id, organizationId));
  return id;
}
