import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

import AppProvider from "#/components/app-provider";
import LogoTitle from "#/components/logo-title";
import { buttonVariants } from "#/components/ui/button";
import { Toaster } from "#/components/ui/sonner";

import styles from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Initiate — Build What Matters" },
      {
        name: "description",
        content: "Discover collaborators, services, and practical resources for your next venture.",
      },
    ],
    links: [
      { rel: "stylesheet", href: styles },
      { rel: "icon", href: "/assets/logo.png", type: "image/png" },
    ],
  }),
  component: Root,
  shellComponent: Document,
  notFoundComponent: NotFound,
});

function Root() {
  return (
    <AppProvider>
      <Outlet />
      <Toaster richColors />
    </AppProvider>
  );
}

function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <main className="bg-background grid min-h-dvh place-items-center px-6">
      <section className="max-w-md text-center">
        <LogoTitle className="mx-auto h-10 w-auto" />
        <p className="text-muted-foreground mt-10 text-sm font-medium">404 · Page not found</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance">
          This path has not been initiated yet.
        </h1>
        <p className="text-muted-foreground mt-4 text-pretty">
          Return home to continue discovering people, services, and opportunities.
        </p>
        <Link className={buttonVariants({ className: "mt-8" })} to="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
