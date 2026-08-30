"use client";

import ReactECharts from "echarts-for-react";
import { Calendar, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/ui/table";
import useBackend from "#/lib/backend/client";
import type {
  DashboardChartData,
  DashboardInsights,
  DashboardMetrics,
  DashboardService,
  DashboardTransaction,
} from "#/lib/backend/connectors/dashboard";
import Loading from "#/routes/-pages/loading";

export default function DashboardPage() {
  const backend = useBackend();

  const [loading, setLoading] = useState<boolean>(false);
  const [revenueData, setRevenueData] = useState<DashboardChartData[]>([]);
  const [services, setServices] = useState<DashboardService[]>([]);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState<string>("7");
  const [showInsights, setShowInsights] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: "0.00",
    mrr: "0",
    totalTransactions: 0,
    avgOrderValue: "0.00",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, rRes, svcRes, txRes] = await Promise.all([
        backend.dashboard.getMetrics(),
        backend.dashboard.getRevenueChart(),
        backend.dashboard.getTopServices(),
        backend.dashboard.getRecentTransactions(),
      ]);
      setMetrics(mRes);
      setRevenueData(rRes);
      setServices(svcRes);
      setTransactions(txRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    setInsightsLoading(true);
    setShowInsights(true);
    try {
      const ins = await backend.dashboard.getInsights();
      setInsights(ins);
    } catch (e) {
      console.error(e);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeFilter]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Overview of your organization’s performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="text-muted-foreground h-5 w-5" />
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={loadInsights} disabled={insightsLoading} variant="secondary">
            <Sparkles className="mr-2 h-4 w-4" />
            {insightsLoading ? "Analyzing..." : "AI Insights"}
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${metrics.totalRevenue}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${metrics.mrr}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.totalTransactions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Order</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${metrics.avgOrderValue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className={"grid grid-cols-1 gap-4"}>
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className={"h-72"}>
            {revenueData.length ? (
              <ReactECharts
                option={{
                  xAxis: { type: "category", data: revenueData.map((d) => d.day) },
                  yAxis: { type: "value" },
                  series: [{ data: revenueData.map((d) => d.revenue), type: "line", smooth: true }],
                  tooltip: { trigger: "axis" },
                }}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <p className={"text-muted-foreground text-center"}>No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Services</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length ? (
                  services.map((svc, i) => (
                    <TableRow key={i}>
                      <TableCell>{svc.name}</TableCell>
                      <TableCell>{svc.sales}</TableCell>
                      <TableCell>${svc.revenue}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground text-center">
                      No records
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length ? (
                  transactions.map((tx, i) => (
                    <TableRow key={i}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>{tx.customer}</TableCell>
                      <TableCell>{tx.amount}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tx.status === "completed" ? "bg-green-100 text-green-800" : tx.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}
                        >
                          {tx.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center">
                      No records
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Overlay */}
      {showInsights && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>AI Business Insights</CardTitle>
                <Button variant="ghost" onClick={() => setShowInsights(false)}>
                  <X />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="max-h-[80vh] space-y-6 overflow-y-auto">
              {insightsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="loader" />
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-muted-foreground text-sm">
                    Based on <strong>{insights?.dataAnalyzed.totalTransactions}</strong> transactions,{" "}
                    <strong>${insights?.dataAnalyzed.totalRevenue}</strong> revenue, and{" "}
                    <strong>{insights?.dataAnalyzed.servicesAnalyzed}</strong> services.
                  </p>
                  <div className={"prose prose-sm dark:prose-invert max-w-none"}>
                    <Markdown>{insights?.insights}</Markdown>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter />
          </Card>
        </div>
      )}
    </div>
  );
}
