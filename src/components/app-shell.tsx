import { ReactNode } from "react";

import AppNavigation from "#/components/app-navigation";

export default function AppShell(props: { children?: ReactNode }) {
  return (
    <div className="bg-background h-dvh w-full overflow-hidden pt-16">
      <div className="h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">{props.children}</div>
      <AppNavigation className="fixed inset-x-0 top-0 z-50" />
    </div>
  );
}
