import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { getSession } from "#/lib/auth/auth.functions";
import { getAuthDestination } from "#/lib/auth/redirect";

export const Route = createFileRoute("/_standalone/auth")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();
    if (!session) return;

    const searchParams = new URL(location.href, "http://localhost").searchParams;
    throw redirect({ href: getAuthDestination(searchParams.get("redirect")) });
  },
  component: Outlet,
});
