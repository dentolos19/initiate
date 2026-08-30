"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Button } from "#/components/ui/button";
import useBackend from "#/lib/backend/client";
import { Statistics } from "#/lib/backend/connectors/admin";
import { notifyLoading } from "#/lib/utils";

export default function Page() {
  const backend = useBackend();

  const [loading, setLoading] = useState<boolean>(true);
  const [statistics, setStatistics] = useState<Statistics>();

  useEffect(() => {
    backend.admin
      .getStatistics()
      .then((data) => {
        setStatistics(data);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={"my-20"}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={"p-4"}>
      <div className={"flex gap-4 [&>*]:flex-1"}>
        <div className={"bg-card rounded-lg border p-4 shadow-lg"}>
          <h2 className={"text-muted-foreground text-sm"}>Users</h2>
          <p className={"text-xl font-medium"}>{statistics?.counts.users ?? 0}</p>
        </div>
        <div className={"bg-card rounded-lg border p-4 shadow-lg"}>
          <h2 className={"text-muted-foreground text-sm"}>Organizations</h2>
          <p className={"text-xl font-medium"}>{statistics?.counts.organizations ?? 0}</p>
        </div>
        <div className={"bg-card rounded-lg border p-4 shadow-lg"}>
          <h2 className={"text-muted-foreground text-sm"}>Services</h2>
          <p className={"text-xl font-medium"}>{statistics?.counts.services ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
