import { createFileRoute, redirect } from "@tanstack/react-router";

import LegacyRoute from "#/components/legacy-route";
import { getSession } from "#/lib/auth/auth.functions";
import { getAuthDestination } from "#/lib/auth/redirect";

export const Route = createFileRoute("/$")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/auth" || location.pathname === "/auth/new") {
      const session = await getSession();
      if (!session) return;

      const searchParams = new URL(location.href, "http://localhost").searchParams;
      throw redirect({ href: getAuthDestination(searchParams.get("redirect")) });
    }

    if (
      !location.pathname.startsWith("/manage") &&
      !location.pathname.startsWith("/messages") &&
      location.pathname !== "/onboarding"
    ) {
      return;
    }
    const session = await getSession();
    if (!session) throw redirect({ href: `/auth?redirect=${encodeURIComponent(location.href)}` });
  },
  component: LegacyRoute,
});
