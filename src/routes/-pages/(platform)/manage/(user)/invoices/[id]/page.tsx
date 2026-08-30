"use client";

import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import useBackend from "#/lib/backend/client";
import { OrderInvoice } from "#/lib/backend/connectors/orders";
import Link from "#/lib/router";
import { useParams, useRouter } from "#/lib/router";
import invoiceStatus from "#/lib/store/invoice-status";
import { formatAmount, formatDate, getLabel } from "#/lib/utils";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const backend = useBackend();
  const params = useParams();
  const [invoice, setInvoice] = useState<OrderInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [scenario, setScenario] = useState<"approved" | "declined">("approved");
  const [declineMessage, setDeclineMessage] = useState<string>();

  useEffect(() => {
    backend.payments
      .getInvoice(params.id)
      .then(setInvoice)
      .catch((error: Error) => {
        toast.error(error.message);
        router.push("/manage/invoices");
      })
      .finally(() => setLoading(false));
  }, [params.id, backend.payments, router]);

  async function handlePayment() {
    if (!invoice) return;
    setProcessing(true);
    setDeclineMessage(undefined);
    try {
      const result = await backend.payments.payInvoice(invoice.id, scenario);
      setInvoice((current) => (current ? { ...current, ...result.invoice } : result.invoice));
      if (result.outcome === "declined") {
        setDeclineMessage(result.message);
        toast.error("Demo payment declined");
      } else {
        toast.success(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not run the demo payment.");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-64 items-center justify-center text-center">
        <div>
          <h2 className="mb-2 text-xl font-semibold">Invoice not found</h2>
          <Button asChild>
            <Link href="/manage/invoices">
              <ArrowLeftIcon />
              Back to invoices
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const serviceName = invoice.order?.service?.name ?? "Service order";
  const organizationName = invoice.order?.service?.organization?.name ?? "Service provider";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Alert className="border-primary/30 bg-primary/5">
        <ShieldCheckIcon />
        <AlertTitle>Demo payment environment</AlertTitle>
        <AlertDescription>
          No card is charged and no real money moves. Choose an outcome to demonstrate the full flow.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge>Demo invoice</Badge>
            <Badge variant="outline">{getLabel(invoiceStatus, invoice.status, "Unknown")}</Badge>
          </div>
          <h1 className="text-2xl font-bold">{serviceName}</h1>
          <p className="text-muted-foreground font-mono text-sm">{invoice.reference}</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-sm">Amount due</p>
          <p className="text-3xl font-semibold">{formatAmount(invoice.amount, invoice.currency)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptIcon className="size-5" />
              Invoice summary
            </CardTitle>
            <CardDescription>Internal references make this flow portable and self-contained.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium">{organizationName}</span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Description</span>
              <span className="text-right">{invoice.description ?? serviceName}</span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(invoice.createdAt)}</span>
            </div>
            {invoice.dueAt && (
              <>
                <Separator />
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Due</span>
                  <span>{formatDate(invoice.dueAt)}</span>
                </div>
              </>
            )}
            {invoice.paidAt && (
              <>
                <Separator />
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Paid</span>
                  <span>{formatDate(invoice.paidAt)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={invoice.status === "paid" ? "border-emerald-500/40" : undefined}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="size-5" />
              {invoice.status === "open" ? "Run payment" : "Payment result"}
            </CardTitle>
            <CardDescription>
              {invoice.status === "open"
                ? "Select the deterministic result you want to demonstrate."
                : "This receipt records a simulated transaction."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.status === "open" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={scenario === "approved" ? "default" : "outline"}
                    className="h-auto justify-start py-3"
                    onClick={() => setScenario("approved")}
                  >
                    <CheckCircle2Icon />
                    <span className="text-left">
                      <span className="block">Approve</span>
                      <span className="text-xs opacity-70">Successful demo</span>
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant={scenario === "declined" ? "destructive" : "outline"}
                    className="h-auto justify-start py-3"
                    onClick={() => setScenario("declined")}
                  >
                    <XCircleIcon />
                    <span className="text-left">
                      <span className="block">Decline</span>
                      <span className="text-xs opacity-70">Failure path</span>
                    </span>
                  </Button>
                </div>
                {declineMessage && (
                  <Alert variant="destructive">
                    <XCircleIcon />
                    <AlertTitle>Payment declined</AlertTitle>
                    <AlertDescription>{declineMessage}</AlertDescription>
                  </Alert>
                )}
                <Button className="w-full" disabled={processing} onClick={handlePayment}>
                  {processing ? "Running simulation…" : `Run ${scenario} payment`}
                </Button>
              </>
            ) : (
              <div className="bg-muted rounded-lg p-4 text-center">
                <CheckCircle2Icon className="mx-auto mb-2 size-8 text-emerald-600" />
                <p className="font-semibold">{getLabel(invoiceStatus, invoice.status, "Complete")}</p>
                <p className="text-muted-foreground text-sm">No real funds were processed.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/manage/invoices">
            <ArrowLeftIcon />
            All invoices
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/manage/orders/${invoice.orderId}`}>
            <CalendarIcon />
            View order
          </Link>
        </Button>
      </div>
    </div>
  );
}
