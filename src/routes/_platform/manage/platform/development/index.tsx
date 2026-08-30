import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { PageContent, PageDescription, PageHeader, PageHeading, PageShell, PageTitle } from "#/components/ui/page";
import useBackend from "#/lib/backend/client";
import { notifyLoading } from "#/lib/utils";

export const Route = createFileRoute("/_platform/manage/platform/development/")({ component: Page });

export default function Page() {
  const backend = useBackend();

  const handleSynchronize = async () => {
    notifyLoading(
      "Starting platform synchronization…",
      backend.admin.synchronizePlatform().then(() => {
        toast.success("Platform synchronization started.");
      }),
    );
  };

  return (
    <PageShell>
      <PageHeader>
        <PageHeading>
          <PageTitle>Developer Controls</PageTitle>
          <PageDescription>Run administrative maintenance tasks for the platform.</PageDescription>
        </PageHeading>
      </PageHeader>
      <PageContent>
        <Button onClick={handleSynchronize}>Synchronize Platform</Button>
      </PageContent>
    </PageShell>
  );
}
