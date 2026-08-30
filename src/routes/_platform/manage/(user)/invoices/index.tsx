import { createFileRoute } from "@tanstack/react-router";
import { CreditCardIcon, DollarSignIcon, ReceiptIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { PageDescription, PageHeader, PageHeading, PageShell, PageTitle } from "#/components/ui/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import useBackend from "#/lib/backend/client";
import { OrderInvoice } from "#/lib/backend/connectors/orders";
import { formatAmount } from "#/lib/utils";

import InvoiceTable from "./-components/invoice-table";

export const Route = createFileRoute("/_platform/manage/(user)/invoices/")({ component: InvoicesPage });

export default function InvoicesPage() {
  const backend = useBackend();
  const [invoices, setInvoices] = useState<OrderInvoice[]>([]);
  const [statistics, setStatistics] = useState<{
    totalInvoices: number;
    draftInvoices: number;
    openInvoices: number;
    paidInvoices: number;
    refundedInvoices: number;
    totalAmount: number;
    paidAmount: number;
    refundedAmount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  function loadInvoices(status?: string) {
    setLoading(true);
    backend.user
      .getUserInvoices("current", 1, 50, status)
      .then((data) => {
        setInvoices(data);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function loadStatistics() {
    backend.user
      .getUserInvoiceStatistics()
      .then((data) => {
        setStatistics(data);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    const statusFilter = activeTab === "all" ? undefined : activeTab;
    loadInvoices(statusFilter);
  }, [activeTab]);

  if (loading && !statistics) {
    return (
      <div className={"flex h-64 items-center justify-center"}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader>
        <PageHeading>
          <PageTitle>Demo Invoices</PageTitle>
          <PageDescription>Run approved and declined payment scenarios without moving real money.</PageDescription>
        </PageHeading>
      </PageHeader>

      {statistics && (
        <div className="grid border-b md:grid-cols-2 lg:grid-cols-4 lg:divide-x">
          <section className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-muted-foreground text-sm font-medium">Total Invoices</h2>
              <ReceiptIcon className="text-muted-foreground size-4" aria-hidden="true" />
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{statistics.totalInvoices}</div>
            <p className={"text-muted-foreground text-xs"}>
              Total amount: {formatAmount(statistics.totalAmount, "usd")}
            </p>
          </section>

          <section className="border-t p-5 sm:p-6 md:border-t-0 md:border-l lg:border-l-0">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-muted-foreground text-sm font-medium">Paid Invoices</h2>
              <DollarSignIcon className="text-muted-foreground size-4" aria-hidden="true" />
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{statistics.paidInvoices}</div>
            <p className={"text-muted-foreground text-xs"}>Paid amount: {formatAmount(statistics.paidAmount, "usd")}</p>
          </section>

          <section className="border-t p-5 sm:p-6 lg:border-t-0">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-muted-foreground text-sm font-medium">Open Invoices</h2>
              <CreditCardIcon className="text-muted-foreground size-4" aria-hidden="true" />
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{statistics.openInvoices}</div>
            <p className={"text-muted-foreground text-xs"}>Awaiting payment</p>
          </section>

          <section className="border-t p-5 sm:p-6 md:border-l lg:border-t-0 lg:border-l-0">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-muted-foreground text-sm font-medium">Refunded</h2>
              <ReceiptIcon className="text-muted-foreground size-4" aria-hidden="true" />
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{statistics.refundedInvoices}</div>
            <p className={"text-muted-foreground text-xs"}>
              {formatAmount(statistics.refundedAmount, "usd")} simulated
            </p>
          </section>
        </div>
      )}

      <section>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
          <TabsList className="grid h-11 w-full grid-cols-5 rounded-none border-b bg-transparent px-4 sm:px-6">
            <TabsTrigger value={"all"}>All</TabsTrigger>
            <TabsTrigger value={"refunded"}>Refunded</TabsTrigger>
            <TabsTrigger value={"open"}>Open</TabsTrigger>
            <TabsTrigger value={"paid"}>Paid</TabsTrigger>
            <TabsTrigger value={"void"}>Void</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0 overflow-x-auto">
            <InvoiceTable
              invoices={invoices}
              loading={loading}
              emptyMessage={
                activeTab === "all"
                  ? "No invoices found. Your invoices will appear here when service providers create them for your orders."
                  : `No ${activeTab} invoices found.`
              }
            />
          </TabsContent>
        </Tabs>
      </section>
    </PageShell>
  );
}
