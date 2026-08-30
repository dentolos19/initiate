import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAdvisor } from "#/lib/providers/advisor";
import { LayoutProps } from "#/types";

export const Route = createFileRoute("/_standalone")({ component: RouteLayout });

function RouteLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
export default function Layout(props: LayoutProps) {
  const { showAdvisorButton, hideAdvisorButton } = useAdvisor();

  useEffect(() => {
    hideAdvisorButton();
    return () => {
      showAdvisorButton();
    };
  }, []);

  return props.children;
}
