import { EditIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Button } from "#/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/ui/table";
import useBackend from "#/lib/backend/client";
import { Order, OrderInvoice, OrderMilestone } from "#/lib/backend/connectors/orders";
import { usePrompt } from "#/lib/providers/prompt";
import { formatDate } from "#/lib/utils";

import MilestoneDialog from "./milestone-dialog";

export default function MilestonesTab(props: { order: Order }) {
  const backend = useBackend();
  const { confirm } = usePrompt();

  const [milestones, setMilestones] = useState<OrderMilestone[]>([]);
  const [invoices, setInvoices] = useState<OrderInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingMilestone, setEditingMilestone] = useState<OrderMilestone | null>(null);

  function openCreateDialog() {
    setEditingMilestone(null);
    setDialogOpen(true);
  }

  function openEditDialog(milestone: OrderMilestone) {
    setEditingMilestone(milestone);
    setDialogOpen(true);
  }

  function handleMilestoneSuccess(milestone: OrderMilestone) {
    if (editingMilestone) {
      // Update existing milestone
      setMilestones((prev) => prev.map((m) => (m.id === milestone.id ? milestone : m)));
    } else {
      // Add new milestone
      setMilestones((prev) => [...prev, milestone]);
    }
  }

  async function handleStatusChange(milestone: OrderMilestone, newStatus: string) {
    try {
      const updatedMilestone = await backend.orders.updateOrderMilestoneStatus(props.order.id, milestone.id, newStatus);
      setMilestones((prev) => prev.map((m) => (m.id === updatedMilestone.id ? updatedMilestone : m)));
      toast.success("Milestone status updated.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  }

  async function handleDelete(milestone: OrderMilestone) {
    if (!(await confirm(`Are you sure you want to delete the milestone "${milestone.name}"?`))) {
      return;
    }

    try {
      await backend.orders.deleteOrderMilestone(props.order.id, milestone.id);
      setMilestones((prev) => prev.filter((m) => m.id !== milestone.id));
      toast.success("Milestone deleted successfully.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  }

  function getInvoiceCount(milestoneId: string): number {
    return invoices.filter((invoice) => invoice.milestoneId === milestoneId).length;
  }

  function getStatusLabel(status: string) {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  useEffect(() => {
    Promise.all([backend.orders.getOrderMilestones(props.order.id), backend.orders.getOrderInvoices(props.order.id)])
      .then(([milestones, invoices]) => {
        setMilestones(milestones);
        setInvoices(invoices);
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
      <div className={"my-20"}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className={"bg-sidebar flex h-12 items-center justify-between border-b px-2"}>
        <h3 className={"font-medium"}>Milestones</h3>
        {(props.order.status === "draft" || props.order.status === "pending") && (
          <Button onClick={openCreateDialog} size={"sm"}>
            <PlusIcon className={"h-4 w-4"} />
            <span>Add Milestone</span>
          </Button>
        )}
      </div>

      <MilestoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={props.order}
        orderId={props.order.id}
        milestone={editingMilestone}
        onSuccess={handleMilestoneSuccess}
      />

      <Table className={"border-b"}>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due At</TableHead>
            <TableHead>Invoices</TableHead>
            {(props.order.status === "draft" || props.order.status === "pending") && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {milestones.map((milestone) => (
            <TableRow key={milestone.id}>
              <TableCell>{milestone.name}</TableCell>
              <TableCell>{milestone.content || "No description provided"}</TableCell>
              <TableCell>
                <Select
                  value={milestone.status}
                  disabled={props.order.status === "draft" || props.order.status === "pending"}
                  onValueChange={(value) => handleStatusChange(milestone, value)}
                >
                  <SelectTrigger className={"w-40"}>
                    <SelectValue>{getStatusLabel(milestone.status)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(props.order.status === "draft" || props.order.status === "pending") && (
                      <SelectItem value={"draft"}>Draft</SelectItem>
                    )}
                    <SelectItem value={"pending"}>Pending</SelectItem>
                    <SelectItem value={"in_progress"}>In Progress</SelectItem>
                    <SelectItem value={"cancelled"}>Cancelled</SelectItem>
                    <SelectItem value={"completed"}>Completed</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{milestone.dueAt ? formatDate(milestone.dueAt) : "No due date"}</TableCell>
              <TableCell>
                <span className={"text-muted-foreground text-sm"}>
                  {getInvoiceCount(milestone.id)} invoice{getInvoiceCount(milestone.id) === 1 ? "" : "s"}
                </span>
              </TableCell>
              {(props.order.status === "draft" || props.order.status === "pending") && (
                <TableCell>
                  <div className={"flex gap-2"}>
                    <Button variant={"outline"} onClick={() => openEditDialog(milestone)}>
                      <EditIcon />
                      <span>Edit</span>
                    </Button>
                    <Button variant={"destructive"} onClick={() => handleDelete(milestone)}>
                      <TrashIcon />
                      <span>Delete</span>
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
