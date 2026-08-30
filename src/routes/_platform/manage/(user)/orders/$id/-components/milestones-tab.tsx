import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Badge } from "#/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/ui/table";
import useBackend from "#/lib/backend/client";
import { Order, OrderMilestone } from "#/lib/backend/connectors/orders";
import { formatDate } from "#/lib/utils";

export default function MilestonesTab(props: { order: Order }) {
  const backend = useBackend();

  const [milestones, setMilestones] = useState<OrderMilestone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  }

  useEffect(() => {
    backend.orders
      .getOrderMilestones(props.order.id)
      .then((milestones) => {
        setMilestones(milestones);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [props.order.id]);

  if (loading) {
    return (
      <div className={"p-4"}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={"flex h-full w-full flex-col gap-4 p-4"}>
      <div className={"flex items-center justify-between"}>
        <h3 className={"text-lg font-semibold"}>Order Milestones</h3>
        <div className={"text-muted-foreground text-sm"}>
          {milestones.length} milestone{milestones.length !== 1 ? "s" : ""}
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className={"text-muted-foreground flex h-64 items-center justify-center"}>
          <div className={"text-center"}>
            <p>No milestones have been created for this order yet.</p>
            <p className={"text-sm"}>The service provider will add milestones to track progress.</p>
          </div>
        </div>
      ) : (
        <div className={"rounded-md border"}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((milestone) => (
                <TableRow key={milestone.id}>
                  <TableCell className={"font-medium"}>{milestone.name}</TableCell>
                  <TableCell className={"max-w-xs truncate"}>{milestone.content || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(milestone.status)}>{milestone.status}</Badge>
                  </TableCell>
                  <TableCell>{milestone.dueAt ? formatDate(milestone.dueAt) : "—"}</TableCell>
                  <TableCell>{formatDate(milestone.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
