"use client";

import { CreditCardIcon, DollarSignIcon, ReceiptIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import useBackend from "#/lib/backend/client";
import { OrderInvoice } from "#/lib/backend/connectors/orders";
import { formatAmount } from "#/lib/utils";

import InvoiceTable from "./_components/invoice-table";

export default function InvoicesPage() {
  const backend = useBackend();
  const [invoices, setInvoices] = useState<OrderInvoice[]>([]);
  const [statistics, setStatistics] = useState<{
    totalInvoices: number;
    draftInvoices: number;
    openInvoices: number;
    paidInvoices: number;
    totalAmount: number;
    paidAmount: number;
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
    <div className={"space-y-6 p-6"}>
      <div>
        <h1 className={"text-2xl font-bold"}>Invoices</h1>
        <p className={"text-muted-foreground"}>View and manage all your invoices from service orders.</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className={"grid gap-4 md:grid-cols-2 lg:grid-cols-4"}>
          <Card>
            <CardHeader className={"flex flex-row items-center justify-between space-y-0 pb-2"}>
              <CardTitle className={"text-sm font-medium"}>Total Invoices</CardTitle>
              <ReceiptIcon className={"text-muted-foreground h-4 w-4"} />
            </CardHeader>
            <CardContent>
              <div className={"text-2xl font-bold"}>{statistics.totalInvoices}</div>
              <p className={"text-muted-foreground text-xs"}>
                Total amount: {formatAmount(statistics.totalAmount, "usd")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={"flex flex-row items-center justify-between space-y-0 pb-2"}>
              <CardTitle className={"text-sm font-medium"}>Paid Invoices</CardTitle>
              <DollarSignIcon className={"text-muted-foreground h-4 w-4"} />
            </CardHeader>
            <CardContent>
              <div className={"text-2xl font-bold"}>{statistics.paidInvoices}</div>
              <p className={"text-muted-foreground text-xs"}>
                Paid amount: {formatAmount(statistics.paidAmount, "usd")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={"flex flex-row items-center justify-between space-y-0 pb-2"}>
              <CardTitle className={"text-sm font-medium"}>Open Invoices</CardTitle>
              <CreditCardIcon className={"text-muted-foreground h-4 w-4"} />
            </CardHeader>
            <CardContent>
              <div className={"text-2xl font-bold"}>{statistics.openInvoices}</div>
              <p className={"text-muted-foreground text-xs"}>Awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={"flex flex-row items-center justify-between space-y-0 pb-2"}>
              <CardTitle className={"text-sm font-medium"}>Draft Invoices</CardTitle>
              <ReceiptIcon className={"text-muted-foreground h-4 w-4"} />
            </CardHeader>
            <CardContent>
              <div className={"text-2xl font-bold"}>{statistics.draftInvoices}</div>
              <p className={"text-muted-foreground text-xs"}>Not yet finalized</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            A complete list of all your invoices with their current status and payment information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={"grid w-full grid-cols-5"}>
              <TabsTrigger value={"all"}>All</TabsTrigger>
              <TabsTrigger value={"draft"}>Draft</TabsTrigger>
              <TabsTrigger value={"open"}>Open</TabsTrigger>
              <TabsTrigger value={"paid"}>Paid</TabsTrigger>
              <TabsTrigger value={"void"}>Void</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className={"space-y-4"}>
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
        </CardContent>
      </Card>
    </div>
  );
}
