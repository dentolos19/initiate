import { orderInvoiceSchema, OrderInvoice } from "#/lib/backend/connectors/orders";
import { BackendPrimitives } from "#/lib/backend/primitives";
import {
  PaymentAccount,
  paymentAccountSchema,
  PaymentResult,
  paymentResultSchema,
} from "#/lib/backend/schema/payments";

type InvoicePaymentResult = PaymentResult & { invoice: OrderInvoice };

export default function mapConnectors(primitives: BackendPrimitives) {
  const resultSchema = paymentResultSchema.extend({ invoice: orderInvoiceSchema });

  return {
    getInvoice: async (invoiceId: string): Promise<OrderInvoice> => {
      const response = await primitives.get(`/payments/invoices/${invoiceId}`);
      return orderInvoiceSchema.parse(response);
    },

    getAccount: async (): Promise<PaymentAccount> => {
      const response = await primitives.get("/payments/account");
      return paymentAccountSchema.parse(response);
    },

    payInvoice: async (invoiceId: string, outcome: "approved" | "declined"): Promise<InvoicePaymentResult> => {
      const response = await primitives.post(`/payments/invoices/${invoiceId}/pay`, { outcome });
      return resultSchema.parse(response);
    },

    refundInvoice: async (invoiceId: string): Promise<InvoicePaymentResult> => {
      const response = await primitives.post(`/payments/invoices/${invoiceId}/refund`);
      return resultSchema.parse(response);
    },
  };
}
