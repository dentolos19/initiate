import { stripe } from "#/lib/server/integrations.js";

export function calculateApplicationFee(cents: number): number {
  const tier1_upperBound = 5000 * 100; // SGD 5,000 = 500000 cents
  const tier2_upperBound = 10000 * 100; // SGD 10,000 = 1000000 cents

  let fee: number;

  if (cents < tier1_upperBound) {
    // 10% fee for amounts below SGD 5,000
    fee = cents * 0.1;
  } else if (cents <= tier2_upperBound) {
    // 7.5% fee for amounts between SGD 5,000 and SGD 10,000
    fee = cents * 0.075;
  } else {
    // 5% fee for amounts above SGD 10,000
    fee = cents * 0.05;
  }

  return Math.round(fee);
}

export async function attachInvoice(
  meta: {
    orderId: string;
    userId: string;
    accountId: string;
    customerId: string;
    serviceName: string;
    servicePlan: string;
  },
  data: {
    currency: string;
    amount: number;
  },
) {
  const invoice = await stripe.invoices.create(
    {
      customer: meta.customerId,
      currency: data.currency,
      application_fee_amount: calculateApplicationFee(data.amount),
      metadata: {
        orderId: meta.orderId,
        userId: meta.userId,
        accountId: meta.accountId,
        customerId: meta.customerId,
      },
    },
    {
      stripeAccount: meta.accountId,
    },
  );

  await stripe.invoiceItems.create(
    {
      customer: meta.customerId,
      invoice: invoice.id,
      currency: data.currency,
      amount: data.amount,
      description: `${meta.serviceName} - ${meta.servicePlan}`,
    },
    {
      stripeAccount: meta.accountId,
    },
  );
}
