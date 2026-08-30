"use client";

import { useEffect } from "react";

import { useSession } from "#/lib/providers/session";
import { useRouter } from "#/lib/router";
import Loading from "#/routes/-pages/loading";
import { LayoutProps } from "#/types";

export default function Layout(props: LayoutProps) {
  const router = useRouter();
  const { loading, user } = useSession();

  useEffect(() => {
    if (loading) return;
    if (user?.type === "admin") return;
    router.push("/manage");
  }, [loading, user]);

  if (loading) {
    return <Loading />;
  }

  if (user?.type !== "admin") {
    return null;
  }

  return props.children;
}
