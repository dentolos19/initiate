import { Outlet, createFileRoute } from "@tanstack/react-router";

import { useSession } from "#/lib/providers/session";
import Loading from "#/routes/-components/loading";
import { LayoutProps } from "#/types";

export const Route = createFileRoute("/_platform/manage/organization")({ component: RouteLayout });

function RouteLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
export default function Layout(props: LayoutProps) {
  const { loading, organization } = useSession();

  if (loading) {
    return <Loading />;
  }

  if (!organization) {
    return (
      <div className={"grid size-full place-content-center"}>
        <p>You are not allowed to enter this page.</p>
      </div>
    );
  }

  return props.children;
}
