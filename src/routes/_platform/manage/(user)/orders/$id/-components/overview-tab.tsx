import { MessageCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { RichViewer } from "#/components/ui/custom/rich";
import useBackend from "#/lib/backend/client";
import { Order } from "#/lib/backend/connectors/orders";
import { useRouter } from "#/lib/router";
import { formatDateTime } from "#/lib/utils";

export default function OverviewTab(props: { order: Order }) {
  const backend = useBackend();
  const router = useRouter();

  const handleContact = async () => {
    const organizationId = props.order.organization?.id;
    if (!organizationId) {
      toast.error("This order has no organization to contact.");
      return;
    }

    await backend.messages
      .createOrganizationRoom(organizationId)
      .then((room) => {
        router.push(`/messages/${room.id}`);
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.message);
      });
  };

  return (
    <div className={"space-y-4 p-4"}>
      <div className={"flex gap-4"}>
        <Card className={"flex-1"}>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className={"space-y-2"}>
            <div className={"flex items-center justify-between"}>
              <span className={"text-muted-foreground"}>Order ID</span>
              <span className={"font-medium"}>{props.order.id}</span>
            </div>
            <div className={"flex items-center justify-between"}>
              <span className={"text-muted-foreground"}>Service Name</span>
              <span className={"font-medium"}>{props.order.service?.name}</span>
            </div>
            {props.order.plan && (
              <div className={"flex items-center justify-between"}>
                <span className={"text-muted-foreground"}>Plan Name</span>
                <span className={"font-medium"}>{props.order.plan?.name}</span>
              </div>
            )}
            <div className={"flex items-center justify-between"}>
              <span className={"text-muted-foreground"}>Duration</span>
              <span className={"font-medium"}>Immediate</span>
            </div>
            <div className={"flex items-center justify-between"}>
              <span className={"text-muted-foreground"}>Ordered On</span>
              <span className={"font-medium"}>{formatDateTime(props.order.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
        <Card className={"min-w-80"}>
          <CardHeader>
            <CardTitle>Seller Information</CardTitle>
          </CardHeader>
          <CardContent className={"flex-1 space-y-2"}>
            <div className={"flex items-center justify-between"}>
              <span className={"text-muted-foreground"}>Organization Name</span>
              <span className={"font-medium"}>{props.order.organization?.name}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className={"w-full"} variant={"outline"} onClick={handleContact}>
              <MessageCircleIcon />
              <span>Contact Seller</span>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Order Description</CardTitle>
        </CardHeader>
        <CardContent>
          <RichViewer content={props.order.description || "No description available."} />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <RichViewer content={props.order.instructions || "No custom instructions."} />
        </CardContent>
      </Card>
    </div>
  );
}
