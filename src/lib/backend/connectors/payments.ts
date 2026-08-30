import { BackendPrimitives } from "#/lib/backend/primitives";
import {
  StripeConnect,
  StripeConnectLink,
  stripeConnectLinkSchema,
  stripeConnectSchema,
  StripeConnectSession,
  stripeConnectSessionSchema,
} from "#/lib/backend/schema/stripe";

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    getConnectAccount: async (): Promise<StripeConnect> => {
      const response = await primitives.get("/payments/connect");
      return stripeConnectSchema.parse(response);
    },

    onboardConnectAccount: async (): Promise<StripeConnectLink> => {
      const response = await primitives.get("/payments/connect/onboard");
      return stripeConnectLinkSchema.parse(response);
    },

    accessConnectAccount: async (): Promise<StripeConnectLink> => {
      const response = await primitives.get("/payments/connect/access");
      return stripeConnectLinkSchema.parse(response);
    },

    createConnectSession: async (): Promise<StripeConnectSession> => {
      const response = await primitives.get("/payments/connect/session");
      return stripeConnectSessionSchema.parse(response);
    },
  };
}
