"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import useBackend from "#/lib/backend/client";
import { Order } from "#/lib/backend/connectors/orders";
import { usePrompt } from "#/lib/providers/prompt";
import { useParams } from "#/lib/router";
import orderStatus from "#/lib/store/order-status";
import { getLabel, notifyLoading } from "#/lib/utils";
import InvoicesTab from "#/routes/-pages/(platform)/manage/(user)/orders/[id]/_components/invoices-tab";
import MilestonesTab from "#/routes/-pages/(platform)/manage/(user)/orders/[id]/_components/milestones-tab";
import OverviewTab from "#/routes/-pages/(platform)/manage/(user)/orders/[id]/_components/overview-tab";

export default function Page() {
  const backend = useBackend();
  const params = useParams();
  const { confirm } = usePrompt();

  const id = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [order, setOrder] = useState<Order>();

  const loadOrder = () => {
    setLoading(true);
    backend.orders
      .getOrder(id)
      .then((order) => {
        setOrder(order);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleConfirm = async () => {
    if (!(await confirm("Are you sure you want to confirm this order?"))) return;
    notifyLoading(
      "Confirming order...",
      backend.orders
        .confirmOrder(id)
        .then((order) => {
          setOrder(order);
          toast.success("Order confirmed successfully.");
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        }),
    );
  };

  const handleCancel = async () => {
    if (!(await confirm("Are you sure you want to cancel this order?"))) return;
    notifyLoading(
      "Cancelling order...",
      backend.orders
        .cancelOrder(id)
        .then((order) => {
          setOrder(order);
          toast.success("Order cancelled successfully.");
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        }),
    );
  };

  const handleReject = async () => {
    if (!(await confirm("Are you sure you want to reject this order?"))) return;
    notifyLoading(
      "Rejecting order...",
      backend.orders
        .rejectOrder(id)
        .then((order) => {
          setOrder(order);
          toast.success("Order rejected successfully.");
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        }),
    );
  };

  useEffect(loadOrder, [id]);

  if (loading) {
    return (
      <div className={"my-20"}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className={"my-20"}>
        <p>Order not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className={"border-b shadow-sm"}>
        <div className={"flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-0"}>
          <div className={"flex items-center gap-3"}>
            <div className={"flex flex-col"}>
              <h1
                className={
                  "text-foreground mb-1 flex flex-col items-start gap-2 text-lg font-semibold sm:flex-row sm:items-center sm:text-xl"
                }
              >
                <span className={"break-words"}>{order.service?.name || order.name}</span>
                <Badge variant={"outline"} className={"w-fit"}>
                  {getLabel(orderStatus, order.status, "Unknown")}
                </Badge>
              </h1>
              <p className={"text-muted-foreground text-sm"}>Order #{order.id}</p>
            </div>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            {order.status === "pending" && (
              <Button variant={"destructive"} size={"sm"} className={"flex-1 sm:flex-none"} onClick={handleCancel}>
                <XIcon className={"h-4 w-4"} />
                <span className={"hidden sm:inline"}>Cancel Order</span>
                <span className={"sm:hidden"}>Cancel</span>
              </Button>
            )}
            {order.status === "proposed" && (
              <>
                <Button variant={"default"} size={"sm"} className={"flex-1 sm:flex-none"} onClick={handleConfirm}>
                  <CheckIcon className={"h-4 w-4"} />
                  <span className={"hidden sm:inline"}>Confirm Order</span>
                  <span className={"sm:hidden"}>Confirm</span>
                </Button>
                <Button variant={"destructive"} size={"sm"} className={"flex-1 sm:flex-none"} onClick={handleReject}>
                  <XIcon className={"h-4 w-4"} />
                  <span className={"hidden sm:inline"}>Reject Order</span>
                  <span className={"sm:hidden"}>Reject</span>
                </Button>
              </>
            )}
            {order.status === "confirmed" && (
              <Button variant={"destructive"} size={"sm"} className={"flex-1 sm:flex-none"} onClick={handleCancel}>
                <XIcon className={"h-4 w-4"} />
                <span className={"hidden sm:inline"}>Cancel Order</span>
                <span className={"sm:hidden"}>Cancel</span>
              </Button>
            )}
            {order.status === "rejected" && (
              <Button variant={"destructive"} size={"sm"} className={"flex-1 sm:flex-none"} onClick={handleCancel}>
                <XIcon className={"h-4 w-4"} />
                <span className={"hidden sm:inline"}>Cancel Order</span>
                <span className={"sm:hidden"}>Cancel</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue={"overview"}>
        <TabsList className={"bg-background w-full rounded-none border-b"}>
          <TabsTrigger value={"overview"}>Overview</TabsTrigger>
          <TabsTrigger value={"milestones"}>Milestones</TabsTrigger>
          <TabsTrigger value={"invoices"}>Invoices</TabsTrigger>
        </TabsList>
        <TabsContent value={"overview"}>
          <OverviewTab order={order} />
        </TabsContent>
        <TabsContent value={"milestones"}>
          <MilestonesTab order={order} />
        </TabsContent>
        <TabsContent value={"invoices"}>
          <InvoicesTab order={order} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
