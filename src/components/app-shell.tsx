import { ReactNode } from "react";

import AppNavigation from "#/components/app-navigation";

export default function AppShell(props: { children?: ReactNode }) {
  return (
    <div className="bg-background h-dvh w-full overflow-hidden pt-16">
      <a
        className="bg-background focus-visible:ring-ring fixed top-2 left-4 z-60 -translate-y-16 rounded-md border px-3 py-2 text-sm font-medium transition-transform focus-visible:translate-y-0 focus-visible:ring-2"
        href="#main-content"
      >
        Skip to Main Content
      </a>
      <div id="main-content" className="h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain" tabIndex={-1}>
        {props.children}
      </div>
      <AppNavigation className="fixed inset-x-0 top-0 z-50" />
    </div>
  );
}
