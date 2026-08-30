"use client";

import { ArrowLeftIcon, BanknoteIcon, CalendarIcon, CreditCardIcon, ExternalLinkIcon, ReceiptIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import useBackend from "#/lib/backend/client";
import { OrderInvoice } from "#/lib/backend/connectors/orders";
import Link from "#/lib/router";
import { useParams, useRouter } from "#/lib/router";
import stripeInvoiceStatus from "#/lib/store/stripe-invoice-status";
import { formatAmount, formatDate, getLabel } from "#/lib/utils";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const backend = useBackend();
  const params = useParams();

  const [invoice, setInvoice] = useState<OrderInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function loadInvoice() {
      // Since we don't have a specific invoice endpoint, we'll get it from the invoices list
      backend.user
        .getUserInvoices("current", 1, 100)
        .then((data) => {
          const foundInvoice = data.find((inv) => inv.id === params.id);
          if (foundInvoice) {
            setInvoice(foundInvoice);
          } else {
            toast.error("Invoice not found");
            router.push("/manage/invoices");
          }
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
          router.push("/manage/invoices");
        })
        .finally(() => {
          setLoading(false);
        });
    }

    loadInvoice();
  }, [params.id, backend.user, router]);

  if (loading) {
    return (
      <div className={"flex h-64 items-center justify-center"}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className={"flex h-64 items-center justify-center"}>
        <div className={"text-center"}>
          <h2 className={"mb-2 text-xl font-semibold"}>Invoice not found</h2>
          <p className={"text-muted-foreground mb-4"}>
            The invoice you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button asChild>
            <Link href={"/manage/invoices"}>
              <ArrowLeftIcon className={"mr-2 h-4 w-4"} />
              Back to Invoices
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={"space-y-6 p-6"}>
      {/* Header */}
      <div className={"flex items-center justify-between"}>
        <div className={"flex items-center gap-4"}>
          <div>
            <h1 className={"text-2xl font-bold"}>Invoice Details</h1>
            <p className={"text-muted-foreground"}>Invoice ID: {invoice.stripeInvoiceId}</p>
          </div>
        </div>
        <div className={"flex items-center gap-2"}>
          <Badge variant={"outline"} className={"text-sm"}>
            {getLabel(stripeInvoiceStatus, invoice.status, "Unknown")}
          </Badge>
          {invoice.url && (
            <Button variant={"outline"} size={"sm"} asChild>
              <Link href={invoice.url} target={"_blank"}>
                <ExternalLinkIcon className={"mr-2 h-4 w-4"} />
                View in Stripe
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className={"grid gap-6 md:grid-cols-2"}>
        {/* Invoice Information */}
        <Card>
          <CardHeader>
            <CardTitle className={"flex items-center gap-2"}>
              <ReceiptIcon className={"h-5 w-5"} />
              Invoice Information
            </CardTitle>
          </CardHeader>
          <CardContent className={"space-y-4"}>
            <div className={"flex items-center justify-between"}>
              <span className={"text-sm font-medium"}>Amount</span>
              <span className={"text-lg font-semibold"}>{formatAmount(invoice.amount, invoice.currency)}</span>
            </div>
            <Separator />
            <div className={"flex items-center justify-between"}>
              <span className={"text-sm font-medium"}>Currency</span>
              <span className={"text-sm uppercase"}>{invoice.currency}</span>
            </div>
            <Separator />
            <div className={"flex items-center justify-between"}>
              <span className={"text-sm font-medium"}>Status</span>
              <Badge variant={"outline"}>{getLabel(stripeInvoiceStatus, invoice.status, "Unknown")}</Badge>
            </div>
            <Separator />
            <div className={"flex items-center justify-between"}>
              <span className={"text-sm font-medium"}>Created</span>
              <span className={"text-sm"}>{formatDate((invoice as any).createdAt || new Date())}</span>
            </div>
            {(invoice as any).dueAt && (
              <>
                <Separator />
                <div className={"flex items-center justify-between"}>
                  <span className={"text-sm font-medium"}>Due Date</span>
                  <span className={"text-sm"}>{formatDate((invoice as any).dueAt)}</span>
                </div>
              </>
            )}
            {(invoice as any).paidAt && (
              <>
                <Separator />
                <div className={"flex items-center justify-between"}>
                  <span className={"text-sm font-medium"}>Paid Date</span>
                  <span className={"text-sm"}>{formatDate((invoice as any).paidAt)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle className={"flex items-center gap-2"}>
              <CreditCardIcon className={"h-5 w-5"} />
              Service Information
            </CardTitle>
          </CardHeader>
          <CardContent className={"space-y-4"}>
            <div>
              <span className={"text-muted-foreground text-sm font-medium"}>Service Name</span>
              <p className={"text-sm font-semibold"}>{(invoice as any).order?.service?.name || "Unknown Service"}</p>
            </div>
            <Separator />
            <div>
              <span className={"text-muted-foreground text-sm font-medium"}>Organization</span>
              <p className={"text-sm font-semibold"}>
                {(invoice as any).order?.service?.organization?.name || "Unknown Organization"}
              </p>
            </div>
            <Separator />
            <div>
              <span className={"text-muted-foreground text-sm font-medium"}>Order ID</span>
              <p className={"font-mono text-sm"}>{invoice.orderId}</p>
            </div>
            {(invoice as any).order?.description && (
              <>
                <Separator />
                <div>
                  <span className={"text-muted-foreground text-sm font-medium"}>Description</span>
                  <p className={"text-sm"}>{(invoice as any).order.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Available actions for this invoice based on its current status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={"flex flex-wrap gap-2"}>
            {/* Pay Invoice */}
            {invoice.url && invoice.status === "open" && (
              <Button asChild>
                <Link href={invoice.url} target={"_blank"}>
                  <BanknoteIcon className={"mr-2 h-4 w-4"} />
                  Pay Invoice
                </Link>
              </Button>
            )}

            {/* View Invoice */}
            {invoice.url && (
              <Button variant={"outline"} asChild>
                <Link href={invoice.url} target={"_blank"}>
                  <ReceiptIcon className={"mr-2 h-4 w-4"} />
                  View Full Invoice
                </Link>
              </Button>
            )}

            {/* View Order */}
            <Button variant={"outline"} asChild>
              <Link href={`/manage/orders/${invoice.orderId}`}>
                <CalendarIcon className={"mr-2 h-4 w-4"} />
                View Order
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
