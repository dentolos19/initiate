import { Outlet, createFileRoute } from "@tanstack/react-router";
import { ReactNode } from "react";

import AppShell from "#/components/app-shell";

export const Route = createFileRoute("/_platform")({ component: RouteLayout });

function RouteLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
export default function Layout(props: { children: ReactNode }) {
  return <AppShell>{props.children}</AppShell>;
}
