import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, MailCheck, ShieldCheck } from "lucide-react";

import { Button } from "#/components/ui/button";
import { PageDescription, PageHeader, PageHeading, PageShell, PageTitle } from "#/components/ui/page";

export const Route = createFileRoute("/_platform/manage/platform/email/analytics/")({
  component: EmailAnalyticsPage,
});

export default function EmailAnalyticsPage() {
  return (
    <PageShell>
      <PageHeader>
        <PageHeading>
          <PageTitle>Email Operations</PageTitle>
          <PageDescription>
            Transactional email now runs through the Worker&apos;s native Email Sending binding. Delivery controls and
            domain status live in Cloudflare.
          </PageDescription>
        </PageHeading>
        <Button asChild>
          <a href="https://dash.cloudflare.com/?to=/:account/email" target="_blank" rel="noreferrer">
            Open Cloudflare Email <ExternalLink aria-hidden="true" />
          </a>
        </Button>
      </PageHeader>

      <div className="grid border-b md:grid-cols-2 md:divide-x">
        <section className="px-4 py-5 sm:px-6">
          <MailCheck className="text-primary mb-4 size-5" aria-hidden="true" />
          <h2 className="font-semibold">Native Delivery</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            Email is composed and sent inside the same Worker that handles the application. The sending domain must be
            enabled in Cloudflare before production delivery can begin.
          </p>
        </section>
        <section className="border-t px-4 py-5 sm:px-6 md:border-t-0">
          <ShieldCheck className="text-primary mb-4 size-5" aria-hidden="true" />
          <h2 className="font-semibold">Configuration Status</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            The <code>EMAIL</code> binding and sender identity are configured for this deployment.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
