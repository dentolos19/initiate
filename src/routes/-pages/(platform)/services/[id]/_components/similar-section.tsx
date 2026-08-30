"use client";

import { PencilRulerIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Card } from "#/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "#/components/ui/carousel";
import { Separator } from "#/components/ui/separator";
import useBackend from "#/lib/backend/client";
import { Service } from "#/lib/backend/schema";
import { useParams } from "#/lib/router";
import ServiceCard from "#/routes/-pages/(platform)/_components/service-card";

export default function SimilarSection() {
  const backend = useBackend();
  const params = useParams();

  const id = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    backend.service
      .similarServices(id)
      .then((services) => {
        setServices(services);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Card className={"gap-0 py-6"}>
      {/* Header */}
      <div className={"px-6"}>
        <div className={"flex items-center justify-between"}>
          <div>
            <h2 className={"mb-1 flex items-center gap-2"}>
              <PencilRulerIcon className={"size-6"} />
              <span className={"text-2xl font-bold"}>Similar Services</span>
            </h2>
            <p className={"text-muted-foreground text-sm"}>Find other similar services to this service right now.</p>
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

      {/* Services */}
      {!loading && services.length > 0 && (
        <Carousel className={"px-6"} opts={{ align: "start" }}>
          {/* TODO: Fix overflow issue */}
          <CarouselContent>
            {services.slice(0, 5).map((service) => (
              <CarouselItem key={service.id} className={"sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"}>
                <ServiceCard data={service} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {/* <CarouselPrevious className={"max-sm:hidden"} />
          <CarouselNext className={"max-sm:hidden"} /> */}
        </Carousel>
      )}
    </Card>
  );
}
