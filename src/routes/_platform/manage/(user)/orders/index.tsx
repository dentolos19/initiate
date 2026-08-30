import { createFileRoute } from "@tanstack/react-router";
import {
  MessageCircleIcon,
  PackageCheckIcon,
  PackageIcon,
  PackageOpenIcon,
  PackageSearchIcon,
  ShoppingBagIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import useBackend from "#/lib/backend/client";
import { Order } from "#/lib/backend/connectors/orders";
import { OrderStatus } from "#/lib/backend/schema";
import Link from "#/lib/router";
import { useRouter, useSearchParams } from "#/lib/router";
import orderStatus from "#/lib/store/order-status";
import serviceTypes from "#/lib/store/service-types";
import { formatDateTime, getLabel } from "#/lib/utils";

export const Route = createFileRoute("/_platform/manage/(user)/orders/")({ component: Page });

export default function Page() {
  const backend = useBackend();
  const router = useRouter();
  const searchParams = useSearchParams();

  const filter = (searchParams.get("filter") as OrderStatus | "all") || "all";

  const [loading, setLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    pendingConfirmation: 0,
    pendingCompletion: 0,
    completedOrders: 0,
  });

  function setFilter(value: OrderStatus | "all") {
    if (value === filter) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("filter");
    } else {
      params.set("filter", value);
    }
    router.push(`/manage/orders?${params.toString()}`);
  }

  async function handleContact(organizationId: string) {
    await backend.messages
      .createRoom("current", organizationId)
      .then((room) => {
        router.push(`/messages/${room.id}?context=user&act=user`);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  function loadOrders() {
    setLoading(true);
    setOrders([]);

    Promise.all([
      backend.user.getUserOrders("current", filter === "all" ? undefined : filter),
      backend.user.getUserOrderStatistics("current"),
    ])
      .then(([orders, stats]) => {
        setOrders(orders);
        setStatistics(stats);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadOrders();
  }, [filter]);

  return (
    <div className={"flex h-full flex-col"}>
      {/* Statistics */}
      <div className={"border-b"}>
        <div className={"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}>
          <div className={"flex items-center justify-between border-r p-6"}>
            <div>
              <h2 className={"text-muted-foreground text-sm font-medium"}>Total Orders</h2>
              <p className={"mt-1 text-2xl font-semibold tabular-nums"}>{statistics.totalOrders}</p>
            </div>
            <PackageIcon className={"text-muted-foreground h-8 w-8"} />
          </div>
          <div className={"flex items-center justify-between border-r p-6"}>
            <div>
              <h2 className={"text-muted-foreground text-sm font-medium"}>Pending Confirmation</h2>
              <p className={"mt-1 text-2xl font-semibold tabular-nums"}>{statistics.pendingConfirmation}</p>
            </div>
            <PackageSearchIcon className={"text-muted-foreground h-8 w-8"} />
          </div>
          <div className={"flex items-center justify-between border-r p-6"}>
            <div>
              <h2 className={"text-muted-foreground text-sm font-medium"}>Pending Completion</h2>
              <p className={"mt-1 text-2xl font-semibold tabular-nums"}>{statistics.pendingCompletion}</p>
            </div>
            <PackageOpenIcon className={"text-muted-foreground h-8 w-8"} />
          </div>
          <div className={"flex items-center justify-between p-6"}>
            <div>
              <h2 className={"text-muted-foreground text-sm font-medium"}>Completed Orders</h2>
              <p className={"mt-1 text-2xl font-semibold tabular-nums"}>{statistics.completedOrders}</p>
            </div>
            <PackageCheckIcon className={"text-muted-foreground h-8 w-8"} />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className={"border-b"}>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as OrderStatus | "all")}>
          <TabsList className={"w-full rounded-none bg-transparent"}>
            <TabsTrigger value={"all"} className={"rounded-md"}>
              All
            </TabsTrigger>
            <TabsTrigger value={"draft"} className={"rounded-md"}>
              Draft
            </TabsTrigger>
            <TabsTrigger value={"pending"} className={"rounded-md"}>
              Pending
            </TabsTrigger>
            <TabsTrigger value={"confirmed"} className={"rounded-md"}>
              Confirmed
            </TabsTrigger>
            <TabsTrigger value={"completed"} className={"rounded-md"}>
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Orders */}
      <div className={"bg-background flex-1 overflow-auto"}>
        <Table>
          <TableHeader className={"bg-background sticky top-0"}>
            <TableRow>
              <TableHead className={"font-semibold"}>Name</TableHead>
              <TableHead className={"font-semibold"}>Type</TableHead>
              <TableHead className={"font-semibold"}>Status</TableHead>
              <TableHead className={"font-semibold"}>Order Date</TableHead>
              <TableHead className={"font-semibold"}>Seller Name</TableHead>
              <TableHead className={"font-semibold"}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* While Loading */}
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className={"text-muted-foreground py-12 text-center"}>
                  <LoadingSpinner />
                </TableCell>
              </TableRow>
            )}

            {/* No Items */}
            {!loading && orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className={"text-muted-foreground py-12 text-center"}>
                  <div className={"flex flex-col items-center gap-2"}>
                    <PackageIcon className={"text-muted-foreground/50 h-12 w-12"} />
                    <p className={"font-medium"}>No Orders Found</p>
                    <p className={"text-sm"}>You haven't placed any orders yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* With Items */}
            {orders.map((order) => (
              <TableRow key={order.id} className={"hover:bg-muted/50"}>
                <TableCell>
                  <Link className={"mb-1 font-medium hover:underline"} href={`/services/${order.service?.id}`}>
                    {order.service?.name || order.name}
                  </Link>
                  <p className={"text-muted-foreground font-mono text-xs"}>{order.id}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={"outline"}>{getLabel(serviceTypes, order.service?.type, "Custom")}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={"secondary"}>{getLabel(orderStatus, order.status, "Unknown")}</Badge>
                </TableCell>
                <TableCell className={"text-muted-foreground"}>{formatDateTime(order.createdAt)}</TableCell>
                <TableCell>
                  <Link className={"hover:underline"} href={`/organizations/${order.organization?.id}`}>
                    {order.organization?.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className={"flex items-center gap-2"}>
                    <Button variant={"default"} size={"sm"} asChild>
                      <Link href={`/manage/orders/${order.id}`}>
                        <ShoppingBagIcon className={"h-4 w-4"} />
                        <span>View Details</span>
                      </Link>
                    </Button>
                    <Button variant={"outline"} size={"sm"} onClick={() => handleContact(order.organization!.id!)}>
                      <MessageCircleIcon className={"h-4 w-4"} />
                      <span>Contact Seller</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
