import { createFileRoute, redirect } from "@tanstack/react-router";

import LegacyRoute from "#/components/legacy-route";
import { getSession } from "#/lib/auth/auth.functions";

export const Route = createFileRoute("/$")({
  beforeLoad: async ({ location }) => {
    if (!location.pathname.startsWith("/manage") && !location.pathname.startsWith("/messages")) return;
    const session = await getSession();
    if (!session) throw redirect({ href: `/auth?redirect=${encodeURIComponent(location.href)}` });
  },
  component: LegacyRoute,
});
