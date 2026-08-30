import * as React from "react";

import { cn } from "#/lib/utils";

function PageShell({ className, ...props }: React.ComponentProps<"main">) {
  return <main className={cn("min-w-0 w-full", className)} {...props} />;
}

function PageHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      className={cn(
        "flex min-w-0 flex-col gap-4 border-b px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className,
      )}
      {...props}
    />
  );
}

function PageHeading({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-w-0 space-y-1", className)} {...props} />;
}

function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return <h1 className={cn("text-xl font-semibold tracking-tight text-balance sm:text-2xl", className)} {...props} />;
}

function PageDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-muted-foreground max-w-3xl text-sm leading-6 text-pretty", className)} {...props} />;
}

function PageContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-w-0 w-full p-4 sm:p-6", className)} {...props} />;
}

function PageSection({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("min-w-0 border-b", className)} {...props} />;
}

export { PageContent, PageDescription, PageHeader, PageHeading, PageSection, PageShell, PageTitle };
