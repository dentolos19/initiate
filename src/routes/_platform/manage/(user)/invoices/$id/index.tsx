import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  LockIcon,
  ReceiptIcon,
  XCircleIcon,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import useBackend from "#/lib/backend/client";
import { OrderInvoice } from "#/lib/backend/connectors/orders";
import Link from "#/lib/router";
import { useParams, useRouter } from "#/lib/router";
import invoiceStatus from "#/lib/store/invoice-status";
import { formatAmount, formatDate, getLabel } from "#/lib/utils";

export const Route = createFileRoute("/_platform/manage/(user)/invoices/$id/")({
  component: InvoiceDetailPage,
});

function formatCard(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
}

function isValidCard(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 16 || digits.length > 19) return false;
  return (
    digits
      .split("")
      .reverse()
      .reduce((sum, digit, index) => {
        let number = Number(digit);
        if (index % 2 === 1) {
          number *= 2;
          if (number > 9) number -= 9;
        }
        return sum + number;
      }, 0) %
      10 ===
    0
  );
}

function isValidExpiry(value: string) {
  const [month, year] = value.replaceAll(" ", "").split("/").map(Number);
  if (!month || month > 12 || !year) return false;
  const now = new Date();
  const expiry = new Date(2000 + year, month);
  return expiry > new Date(now.getFullYear(), now.getMonth());
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const backend = useBackend();
  const params = useParams();
  const [invoice, setInvoice] = useState<OrderInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cvc, setCvc] = useState("");
  const [expiry, setExpiry] = useState("");
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

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invoice) return;
    if (cardholder.trim().length < 2) {
      setDeclineMessage("Enter the name shown on the card.");
      return;
    }
    if (!isValidCard(cardNumber)) {
      setDeclineMessage("Enter a valid card number.");
      return;
    }
    if (!isValidExpiry(expiry)) {
      setDeclineMessage("Enter a valid expiration date.");
      return;
    }
    if (!/^\d{3,4}$/.test(cvc)) {
      setDeclineMessage("Enter a valid security code.");
      return;
    }

    setProcessing(true);
    setDeclineMessage(undefined);
    try {
      const outcome = cardNumber.replace(/\D/g, "").endsWith("0002") ? "declined" : "approved";
      const result = await backend.payments.payInvoice(invoice.id, outcome);
      setInvoice((current) => (current ? { ...current, ...result.invoice } : result.invoice));
      if (result.outcome === "declined") {
        setDeclineMessage(result.message);
        toast.error("Payment declined");
      } else {
        toast.success(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not process the payment.");
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
    <div className="w-full space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge>Invoice</Badge>
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
        <Card className="rounded-none border-x-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptIcon className="size-5" />
              Invoice summary
            </CardTitle>
            <CardDescription>Review the invoice details before completing payment.</CardDescription>
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

        <Card
          className={
            invoice.status === "paid" ? "rounded-none border-x-0 border-emerald-500/40" : "rounded-none border-x-0"
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="size-5" />
              {invoice.status === "open" ? "Payment details" : "Payment result"}
            </CardTitle>
            <CardDescription>
              {invoice.status === "open"
                ? `Pay ${formatAmount(invoice.amount, invoice.currency)} securely.`
                : "This receipt records the transaction status."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.status === "open" ? (
              <form className="space-y-4" onSubmit={handlePayment}>
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card information</Label>
                  <div className="border-input focus-within:border-ring focus-within:ring-ring/50 overflow-hidden rounded-md border shadow-xs focus-within:ring-[3px]">
                    <Input
                      id="card-number"
                      className="h-11 rounded-none border-0 shadow-none focus-visible:ring-0"
                      autoComplete="cc-number"
                      inputMode="numeric"
                      placeholder="1234 1234 1234 1234"
                      value={cardNumber}
                      disabled={processing}
                      onChange={(event) => setCardNumber(formatCard(event.target.value))}
                    />
                    <div className="grid grid-cols-2 border-t">
                      <Input
                        aria-label="Expiration date"
                        className="h-11 rounded-none border-0 border-r shadow-none focus-visible:ring-0"
                        autoComplete="cc-exp"
                        inputMode="numeric"
                        placeholder="MM / YY"
                        value={expiry}
                        disabled={processing}
                        onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                      />
                      <Input
                        aria-label="Security code"
                        className="h-11 rounded-none border-0 shadow-none focus-visible:ring-0"
                        autoComplete="cc-csc"
                        inputMode="numeric"
                        placeholder="CVC"
                        value={cvc}
                        disabled={processing}
                        onChange={(event) => setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardholder">Name on card</Label>
                  <Input
                    id="cardholder"
                    className="h-11"
                    autoComplete="cc-name"
                    value={cardholder}
                    disabled={processing}
                    onChange={(event) => setCardholder(event.target.value)}
                  />
                </div>
                {declineMessage && (
                  <Alert variant="destructive">
                    <XCircleIcon />
                    <AlertTitle>Payment declined</AlertTitle>
                    <AlertDescription>{declineMessage}</AlertDescription>
                  </Alert>
                )}
                <Button className="h-11 w-full" disabled={processing} type="submit">
                  {processing ? "Processing…" : `Pay ${formatAmount(invoice.amount, invoice.currency)}`}
                </Button>
                <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
                  <LockIcon className="size-3.5" />
                  Card details are protected and never stored.
                </p>
              </form>
            ) : (
              <div className="bg-muted rounded-lg p-4 text-center">
                <CheckCircle2Icon className="mx-auto mb-2 size-8 text-emerald-600" />
                <p className="font-semibold">{getLabel(invoiceStatus, invoice.status, "Complete")}</p>
                <p className="text-muted-foreground text-sm">The invoice status has been updated.</p>
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
