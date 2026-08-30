"use client";

import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import useBackend from "#/lib/backend/client";
import { notifyLoading } from "#/lib/utils";

export default function Page() {
  const backend = useBackend();

  const handleSynchronize = async () => {
    notifyLoading(
      "Starting platform synchronization...",
      backend.admin.synchronizePlatform().then(() => {
        toast.success("Started platform synchronization!");
      }),
    );
  };

  return (
    <div className={"p-4"}>
      <Button onClick={handleSynchronize}>Synchronize Platform</Button>
    </div>
  );
}
