import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { PageDescription, PageHeader, PageHeading, PageShell, PageTitle } from "#/components/ui/page";
import useBackend from "#/lib/backend/client";
import { Statistics } from "#/lib/backend/connectors/admin";

export const Route = createFileRoute("/_platform/manage/platform/(dashboard)/")({ component: Page });

export default function Page() {
  const { admin } = useBackend();

  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState<boolean>(true);
  const [statistics, setStatistics] = useState<Statistics>();

  useEffect(() => {
    admin
      .getStatistics()
      .then((data) => {
        setStatistics(data);
      })
      .catch((error: Error) => {
        console.error(error);
        setError(error.message);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [admin]);

  if (loading) {
    return (
      <div className={"my-20"}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader>
        <PageHeading>
          <PageTitle>Platform Analytics</PageTitle>
          <PageDescription>Current totals across the Initiate platform.</PageDescription>
        </PageHeading>
      </PageHeader>
      {error ? (
        <p className="text-destructive border-b px-4 py-6 text-sm sm:px-6" role="alert">
          {error} Reload the page to try again.
        </p>
      ) : (
        <div className="grid border-b sm:grid-cols-3 sm:divide-x">
          {[
            { label: "Users", value: statistics?.counts.users ?? 0 },
            { label: "Organizations", value: statistics?.counts.organizations ?? 0 },
            { label: "Services", value: statistics?.counts.services ?? 0 },
          ].map((item, index) => (
            <div key={item.label} className={index > 0 ? "border-t p-5 sm:border-t-0 sm:p-6" : "p-5 sm:p-6"}>
              <h2 className="text-muted-foreground text-sm font-medium">{item.label}</h2>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
