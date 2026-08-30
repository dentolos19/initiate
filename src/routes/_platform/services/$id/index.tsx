import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftRightIcon, HeartCrackIcon, HeartIcon, PhoneIcon, ShoppingBagIcon, StoreIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import ImageWrapper from "#/components/ui/wrappers/image";
import VerifiedBadge from "#/components/verified-badge";
import useBackend from "#/lib/backend/client";
import { Service, ServicePlan } from "#/lib/backend/schema";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import { useParams, useRouter } from "#/lib/router";
import domains from "#/lib/store/domains";
import { formatPrice, formatPriceModel, getLabel } from "#/lib/utils";
import Loading from "#/routes/-components/loading";
import DescriptionSection from "#/routes/_platform/services/$id/-components/description-section";
import ReviewsSection from "#/routes/_platform/services/$id/-components/reviews-section";
import SimilarSection from "#/routes/_platform/services/$id/-components/similar-section";

export const Route = createFileRoute("/_platform/services/$id/")({ component: Page });

export default function Page() {
  const backend = useBackend();
  const session = useSession();
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [service, setService] = useState<Service>();
  const [serviceLiked, setServiceLiked] = useState<boolean>(false);
  const [servicePlans, setPlans] = useState<ServicePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>();

  async function handleOrder() {
    if (!session.user) {
      toast.error("You must be logged in to order a service.");
      return;
    }

    if (!selectedPlanId) {
      toast.error("Please select a plan before ordering.");
      return;
    }
    router.push(`/services/${id}/order?planId=${selectedPlanId}`);
  }

  async function handleContact() {
    if (!service) return;

    await backend.messages
      .createOrganizationRoom(service.organizationId)
      .then((room) => {
        router.push(`/messages/${room.id}`);
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  async function handleLike() {
    await backend.service
      .likeService(id)
      .then(() => {
        setServiceLiked(true);
        toast.success("You liked this service.");
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  async function handleUnlike() {
    await backend.service
      .unlikeService(id)
      .then(() => {
        setServiceLiked(false);
        toast.success("You unliked this service.");
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  useEffect(() => {
    Promise.all([
      backend.service.getService(id).then((service) => {
        setService(service);
        setServiceLiked(service.isLiked);
      }),
      backend.service.getServicePlans(id).then((plans) => {
        setPlans(plans);
        if (plans.length > 0) setSelectedPlanId(plans[0].id);
      }),
    ])
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!service) {
    return <div className={"my-20 text-center"}>Service not found.</div>;
  }

  const plan = servicePlans.find((plan) => plan.id === selectedPlanId);

  return (
    <div>
      {/* Header */}
      <div className={"bg-card border-b"}>
        <ImageWrapper className={"h-50 w-full border-b"} src={service.bannerUrl} alt={"Banner"} />
        <div className={"relative flex w-full justify-between gap-4 p-4 pt-12 max-sm:flex-col sm:px-6"}>
          <ImageWrapper className={"absolute -top-30 size-40"} src={service.imageUrl} alt={service.name} />

          {/* Left */}
          <div>
            <div className={"mb-4"}>
              <h1 className={"mb-1 flex items-center gap-2 text-2xl font-bold"}>
                {service.name}
                {!service.verified && <VerifiedBadge />}
              </h1>
              {service.tags && service.tags.length > 0 && (
                <div className={"mb-1 flex gap-1"}>
                  {service.tags.map((tag) => (
                    <Badge key={tag} variant={"outline"}>
                      {getLabel(domains, tag, tag || "Uncategorized")}
                    </Badge>
                  ))}
                </div>
              )}
              <p className={"text-muted-foreground"}>{service.tagline || "No tagline available."}</p>
            </div>
            <div className={"flex flex-1 items-end gap-4 text-sm"}>
              <div className={"flex items-center gap-1"}>
                <HeartIcon className={"size-4"} />
                <span>{service.likes} Likes</span>
              </div>
              <div className={"flex items-center gap-1"}>
                <StoreIcon className={"size-4"} />
                <span>{service.orders} Orders</span>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className={"flex items-end gap-2"}>
            {serviceLiked ? (
              <Button variant={"default"} size={"sm"} onClick={handleUnlike}>
                <HeartCrackIcon />
                <span>Unlike</span>
              </Button>
            ) : (
              <Button variant={"default"} size={"sm"} onClick={handleLike}>
                <HeartIcon />
                <span>Like</span>
              </Button>
            )}
            <Button variant={"outline"} size={"sm"} asChild>
              <Link href={`/services/compare?id=${id}`}>
                <ArrowLeftRightIcon />
                <span>Compare</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={"flex w-full gap-4 p-4 max-lg:flex-col sm:p-6"}>
        {/* Left */}
        <div className={"flex-1 space-y-4"}>
          <DescriptionSection data={service} />
          <ReviewsSection />
          <SimilarSection />
        </div>

        {/* Right */}
        {servicePlans.length > 0 && (
          <Card className={"sticky top-20 h-max min-w-80"}>
            <CardHeader>
              {/* Plan Selector */}
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className={"mb-2 w-full"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {servicePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <span>{plan.name}</span>
                      <span className={"text-muted-foreground text-xs"}>
                        {plan.priceData ? formatPrice(plan.priceData) : "Unknown Price"}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Current Plan */}
              <CardTitle>{plan?.priceData ? formatPrice(plan.priceData) : "Unknown Price"}</CardTitle>
              <CardDescription>{plan?.priceData ? formatPriceModel(plan.priceData) : "Unknown Model"}</CardDescription>
            </CardHeader>
            <CardFooter className={"flex-col gap-2"}>
              <Button className={"w-full"} variant={"default"} onClick={handleOrder}>
                <ShoppingBagIcon />
                <span>Order Now</span>
              </Button>
              <Button className={"w-full"} variant={"outline"} onClick={handleContact}>
                <PhoneIcon />
                <span>Contact Provider</span>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
