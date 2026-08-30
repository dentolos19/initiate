"use client";

import { BanknoteIcon, ReceiptIcon } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/ui/table";
import { OrderInvoice } from "#/lib/backend/connectors/orders";
import Link from "#/lib/router";
import stripeInvoiceStatus from "#/lib/store/stripe-invoice-status";
import { formatAmount, formatDate, getLabel } from "#/lib/utils";

interface InvoiceTableProps {
  invoices: OrderInvoice[];
  loading: boolean;
  emptyMessage?: string;
}

export default function InvoiceTable({ invoices, loading, emptyMessage }: InvoiceTableProps) {
  if (loading) {
    return (
      <div className={"flex h-32 items-center justify-center"}>
        <div className={"text-muted-foreground"}>Loading...</div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice ID</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className={"text-muted-foreground py-8 text-center"}>
              {emptyMessage || "No invoices found."}
            </TableCell>
          </TableRow>
        ) : (
          invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className={"font-mono text-sm"}>{invoice.stripeInvoiceId}</TableCell>
              <TableCell>
                <div className={"space-y-1"}>
                  <div className={"font-medium"}>{(invoice as any).order?.service?.name || "Unknown Service"}</div>
                  <div className={"text-muted-foreground text-sm"}>
                    {(invoice as any).order?.service?.organization?.name || "Unknown Organization"}
                  </div>
                </div>
              </TableCell>
              <TableCell>{formatAmount(invoice.amount, invoice.currency)}</TableCell>
              <TableCell>
                <Badge variant={"outline"}>{getLabel(stripeInvoiceStatus, invoice.status, "Unknown")}</Badge>
              </TableCell>
              <TableCell>{formatDate((invoice as any).createdAt || new Date())}</TableCell>
              <TableCell>
                <div className={"flex gap-2"}>
                  {/* Pay Invoice */}
                  {invoice.url && invoice.status === "open" && (
                    <Button variant={"default"} size={"sm"} asChild>
                      <Link href={invoice.url} target={"_blank"}>
                        <BanknoteIcon className={"h-4 w-4"} />
                        <span>Pay Invoice</span>
                      </Link>
                    </Button>
                  )}

                  {/* View Invoice */}
                  {invoice.url && invoice.status === "paid" && (
                    <Button variant={"default"} size={"sm"} asChild>
                      <Link href={invoice.url} target={"_blank"}>
                        <ReceiptIcon className={"h-4 w-4"} />
                        <span>View Invoice</span>
                      </Link>
                    </Button>
                  )}

                  {/* View Invoice for draft/void */}
                  {invoice.url && (invoice.status === "draft" || invoice.status === "void") && (
                    <Button variant={"outline"} size={"sm"} asChild>
                      <Link href={invoice.url} target={"_blank"}>
                        <ReceiptIcon className={"h-4 w-4"} />
                        <span>View</span>
                      </Link>
                    </Button>
                  )}

                  {/* View Details */}
                  <Button variant={"ghost"} size={"sm"} asChild>
                    <Link href={`/manage/invoices/${invoice.id}`}>
                      <span>Details</span>
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
