"use client";

import { useSession } from "#/lib/providers/session";
import Loading from "#/routes/-pages/loading";
import { LayoutProps } from "#/types";

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
