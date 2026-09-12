import { BanknoteIcon, ReceiptIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/ui/table";
import useBackend from "#/lib/backend/client";
import { Order, OrderInvoice } from "#/lib/backend/connectors/orders";
import Link from "#/lib/router";
import invoiceStatus from "#/lib/store/invoice-status";
import { formatAmount, getLabel } from "#/lib/utils";

export default function InvoicesTab(props: { order: Order }) {
  const backend = useBackend();

  const [loading, setLoading] = useState<boolean>(true);
  const [invoices, setInvoices] = useState<OrderInvoice[]>([]);

  useEffect(() => {
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
  }, []);

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
        <h3 className={"text-lg font-semibold"}>Order Invoices</h3>
        <div className={"text-muted-foreground text-sm"}>
          {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className={"text-muted-foreground flex h-64 items-center justify-center"}>
          <div className={"text-center"}>
            <p>No invoices have been created for this order yet.</p>
            <p className={"text-sm"}>Invoices will appear here once the service provider creates them.</p>
          </div>
        </div>
      ) : (
        <div className={"rounded-md border"}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className={"font-mono text-sm"}>{invoice.reference}</TableCell>
                  <TableCell className={"font-medium"}>{formatAmount(invoice.amount, invoice.currency)}</TableCell>
                  <TableCell>
                    <Badge variant={"outline"}>{getLabel(invoiceStatus, invoice.status, "Unknown")}</Badge>
                  </TableCell>
                  <TableCell>
                    {/* Pay Invoice */}
                    {invoice.status === "open" && (
                      <Button variant={"default"} size={"sm"} asChild>
                        <Link href={`/manage/invoices/${invoice.id}`}>
                          <BanknoteIcon />
                          <span>Pay invoice</span>
                        </Link>
                      </Button>
                    )}

                    {/* View Invoice */}
                    {(invoice.status === "paid" || invoice.status === "refunded") && (
                      <Button variant={"default"} size={"sm"} asChild>
                        <Link href={`/manage/invoices/${invoice.id}`}>
                          <ReceiptIcon />
                          <span>View receipt</span>
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
