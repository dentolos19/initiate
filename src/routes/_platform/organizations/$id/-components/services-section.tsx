import { PencilRulerIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Card } from "#/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "#/components/ui/carousel";
import { Separator } from "#/components/ui/separator";
import useBackend from "#/lib/backend/client";
import { Service } from "#/lib/backend/schema";
import { useParams } from "#/lib/router";
import Loading from "#/routes/-components/loading";
import ServiceCard from "#/routes/_platform/-components/service-card";

export default function ServicesSection() {
  const backend = useBackend();
  const params = useParams();

  const id = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    backend.organization
      .getOrganizationServices(id)
      .then((services) => {
        setServices(services);
      })
      .catch((error: Error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <Card className={"gap-0 py-6"}>
      {/* Header */}
      <div className={"px-6"}>
        <div className={"flex items-center justify-between"}>
          <div>
            <h2 className={"mb-1 flex items-center gap-2"}>
              <PencilRulerIcon className={"size-6"} />
              <span className={"text-2xl font-bold"}>Services</span>
            </h2>
            <p className={"text-muted-foreground text-sm"}>Find services published by this organization.</p>
          </div>
        </div>
        <Separator className={"my-4"} />
      </div>

      {loading && (
        <div className={"text-muted-foreground my-10 text-center"}>
          <LoadingSpinner />
        </div>
      )}

      {/* No Items */}
      {!loading && services.length === 0 && (
        <div className={"text-muted-foreground my-10 text-center"}>No services available.</div>
      )}

      {/* With Items */}
      {!loading && services.length > 0 && (
        <Carousel className={"px-6"} opts={{ align: "start" }}>
          <CarouselContent>
            {services.map((service) => (
              <CarouselItem
                key={service.id}
                className={"basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"}
              >
                <ServiceCard data={service} hideSimilarityScore />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className={"max-sm:hidden"} />
          <CarouselNext className={"max-sm:hidden"} />
        </Carousel>
      )}
    </Card>
  );
}
