import { CheckIcon, EditIcon, PlusIcon, RotateCcwIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/ui/table";
import useBackend from "#/lib/backend/client";
import { Order, OrderInvoice, OrderMilestone } from "#/lib/backend/connectors/orders";
import { usePrompt } from "#/lib/providers/prompt";
import invoiceStatus from "#/lib/store/invoice-status";
import { formatAmount, getLabel } from "#/lib/utils";

import InvoiceDialog from "./invoice-dialog";

export default function InvoicesTab(props: { order: Order }) {
  const backend = useBackend();
  const { confirm } = usePrompt();

  const [loading, setLoading] = useState<boolean>(true);
  const [invoices, setInvoices] = useState<OrderInvoice[]>([]);
  const [milestones, setMilestones] = useState<OrderMilestone[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<OrderInvoice | null>(null);

  function loadInvoices() {
    setLoading(true);
    backend.orders
      .getOrderInvoices(props.order.id)
      .then((invoices) => {
        setInvoices(invoices);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function loadMilestones() {
    backend.orders
      .getOrderMilestones(props.order.id)
      .then((milestones) => {
        setMilestones(milestones);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  function handleCreateInvoice() {
    setSelectedInvoice(null);
    setDialogOpen(true);
  }

  function handleEditInvoice(invoiceId: string) {
    setSelectedInvoice(invoices.find((invoice) => invoice.id === invoiceId) || null);
    setDialogOpen(true);
  }

  async function handleDeleteInvoice(invoiceId: string) {
    if (!(await confirm("Are you sure you want to delete this invoice? This action cannot be undone."))) return;
    await backend.orders
      .deleteOrderInvoice(invoiceId)
      .then(() => {
        toast.success("Invoice deleted successfully.");
        loadInvoices();
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  async function handleVoidInvoice(invoiceId: string) {
    if (!(await confirm("Are you sure you want to void this invoice? This action cannot be undone."))) return;
    await backend.orders
      .deleteOrderInvoice(invoiceId)
      .then(() => {
        toast.success("Invoice voided successfully.");
        loadInvoices();
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  async function handleFinalizeInvoice(invoice: OrderInvoice) {
    if (!(await confirm("Are you sure you want to finalize this invoice? This action cannot be undone."))) return;
    await backend.orders
      .finalizeOrderInvoice(invoice.id)
      .then(() => {
        toast.success("Invoice finalized successfully.");
        loadInvoices();
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  async function handleRefundInvoice(invoice: OrderInvoice) {
    if (!(await confirm("Run a demo refund for this invoice? No real money will move."))) return;
    await backend.payments
      .refundInvoice(invoice.id)
      .then((result) => {
        toast.success(result.message);
        loadInvoices();
      })
      .catch((error: Error) => toast.error(error.message));
  }

  function getMilestoneName(milestoneId: string | null | undefined): string {
    if (!milestoneId) return "No milestone";
    const milestone = milestones.find((m) => m.id === milestoneId);
    return milestone ? milestone.name : "Unknown milestone";
  }

  useEffect(() => {
    loadInvoices();
    loadMilestones();
  }, []);

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
        <h3 className={"font-medium"}>Invoices</h3>
        <Button variant={"outline"} size={"sm"} onClick={handleCreateInvoice}>
          <PlusIcon />
          <span>Create Invoice</span>
        </Button>
      </div>
      <Table className={"border-b"}>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Milestone</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className={"text-muted-foreground py-8 text-center"}>
                No invoices found. Create your first invoice to get started.
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.reference}</TableCell>
                <TableCell>{invoice.description || "No description provided"}</TableCell>
                <TableCell>{getMilestoneName(invoice.milestoneId)}</TableCell>
                <TableCell>{formatAmount(invoice.amount, invoice.currency)}</TableCell>
                <TableCell>
                  <Badge variant={"outline"}>{getLabel(invoiceStatus, invoice.status, "Unknown")}</Badge>
                </TableCell>
                <TableCell>
                  <div className={"flex gap-2"}>
                    {/* Edit Invoice */}
                    {invoice.status === "draft" && (
                      <Button variant={"outline"} size={"sm"} onClick={() => handleEditInvoice(invoice.id)}>
                        <EditIcon />
                        <span>Edit</span>
                      </Button>
                    )}

                    {/* Delete Invoice */}
                    {invoice.status === "draft" && (
                      <Button variant={"destructive"} size={"sm"} onClick={() => handleDeleteInvoice(invoice.id)}>
                        <TrashIcon />
                        <span>Delete</span>
                      </Button>
                    )}

                    {/* Finalize Invoice */}
                    {invoice.status === "draft" && (
                      <Button variant={"outline"} size={"sm"} onClick={() => handleFinalizeInvoice(invoice)}>
                        <CheckIcon />
                        <span>Finalize</span>
                      </Button>
                    )}

                    {/* Void Invoice */}
                    {invoice.status === "open" && (
                      <Button variant={"destructive"} size={"sm"} onClick={() => handleVoidInvoice(invoice.id)}>
                        <TrashIcon />
                        <span>Void</span>
                      </Button>
                    )}

                    {invoice.status === "paid" && (
                      <Button variant={"outline"} size={"sm"} onClick={() => handleRefundInvoice(invoice)}>
                        <RotateCcwIcon />
                        <span>Demo refund</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <InvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        data={{
          orderId: props.order.id,
          invoice: selectedInvoice,
        }}
        onCallback={loadInvoices}
      />
    </div>
  );
}
