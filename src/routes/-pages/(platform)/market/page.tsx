"use client";

import Autoplay from "embla-carousel-autoplay";
import { ArrowRightIcon, HeartIcon, PencilRulerIcon, TimerIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "#/components/ui/carousel";
import { Separator } from "#/components/ui/separator";
import useBackend from "#/lib/backend/client";
import { Service } from "#/lib/backend/schema";
import Link from "#/lib/router";
import domains from "#/lib/store/domains";
import { randomizeArray } from "#/lib/utils";
import ServiceCard from "#/routes/-pages/(platform)/_components/service-card";
import ServiceBanner from "#/routes/-pages/(platform)/market/_components/service-banner";
import Loading from "#/routes/-pages/loading";

export default function Page() {
  const backend = useBackend();

  const [loading, setLoading] = useState<boolean>(true);
  const [relevantServices, setRelevantServices] = useState<Service[]>([]);
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  const [latestServices, setLatestServices] = useState<Service[]>([]);

  const randomizedDomains = useMemo(() => randomizeArray(domains), []);

  useEffect(() => {
    Promise.all([
      backend.service.relevantServices().then((services) => {
        setRelevantServices(services);
      }),
      backend.service.popularServices().then((services) => {
        setPopularServices(services);
      }),
      backend.service.latestServices().then((services) => {
        setLatestServices(services);
      }),
    ]).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={"container mx-auto space-y-4 p-4"}>
      {/* Marketplace Banners */}
      <Carousel plugins={[Autoplay({ delay: 10000 })]} opts={{ loop: false }}>
        <CarouselContent>
          {relevantServices.map((service) => (
            <ServiceBanner key={service.id} className={"h-80 md:h-100"} data={service} />
          ))}
        </CarouselContent>
        <CarouselPrevious className={"max-sm:hidden"} />
        <CarouselNext className={"max-sm:hidden"} />
      </Carousel>

      {/* Domain Categories */}
      <Carousel plugins={[Autoplay({ delay: 5000 })]} opts={{ align: "start" }}>
        <CarouselContent>
          {randomizedDomains.map((domain) => (
            <CarouselItem key={domain.value} className={"md:basis-1/2 lg:basis-1/4"}>
              <Link href={`/market/tags/${domain.value}`}>
                <Card className={"h-full hover:shadow-2xl"}>
                  <CardContent>
                    <div className={"bg-primary text-primary-foreground mb-4 aspect-square w-max rounded-lg p-3"}>
                      <domain.icon className={"size-5"} />
                    </div>
                    <h3 className={"mb-2 text-lg font-medium"}>{domain.label}</h3>
                    <p className={"text-muted-foreground line-clamp-2 text-sm"}>
                      {domain.description || "Explore services in this category."}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className={"max-sm:hidden"} />
        <CarouselNext className={"max-sm:hidden"} />
      </Carousel>

      {/* Featured Services */}
      <div className={"container mx-auto py-4"}>
        {/* Heading */}
        <div className={"mb-4"}>
          <div className={"flex items-center justify-between"}>
            <div>
              <h2 className={"mb-1 flex items-center gap-2"}>
                <PencilRulerIcon className={"size-6"} />
                <span className={"text-2xl font-bold"}>Editor's Pick</span>
              </h2>
              <p className={"text-muted-foreground text-sm"}>Handpicked services to kickstart your journey.</p>
            </div>
            <Button variant={"ghost"} asChild>
              <Link href={"/market/featured"}>
                <span>See More</span>
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
          <Separator className={"mt-4"} />
        </div>

        {/* No Items */}
        {popularServices.length === 0 && (
          <div className={"text-muted-foreground col-span-full my-10 text-center"}>
            No featured services available at the moment.
          </div>
        )}

        {/* With Items */}
        <Carousel opts={{ align: "start" }}>
          <CarouselContent>
            {popularServices.map((service) => (
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
      </div>

      {/* Popular Services */}
      <div className={"container mx-auto py-4"}>
        {/* Heading */}
        <div className={"mb-4"}>
          <div className={"flex items-center justify-between"}>
            <div>
              <h2 className={"mb-1 flex items-center gap-2"}>
                <HeartIcon className={"size-6"} />
                <span className={"text-2xl font-bold"}>Popular Services</span>
              </h2>
              <p className={"text-muted-foreground text-sm"}>Currently trending services on our platform.</p>
            </div>
            <Button variant={"ghost"} asChild>
              <Link href={"/market/popular"}>
                <span>See More</span>
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
          <Separator className={"mt-4"} />
        </div>

        {/* No Items */}
        {popularServices.length === 0 && (
          <div className={"text-muted-foreground col-span-full my-10 text-center"}>
            No popular services available at the moment.
          </div>
        )}

        {/* With Items */}
        <Carousel opts={{ align: "start" }}>
          <CarouselContent>
            {popularServices.map((service) => (
              <CarouselItem
                key={service.id}
                className={"basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"}
              >
                <ServiceCard data={service} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className={"max-sm:hidden"} />
          <CarouselNext className={"max-sm:hidden"} />
        </Carousel>
      </div>

      {/* Latest Services */}
      <div className={"container mx-auto py-4"}>
        {/* Heading */}
        <div className={"mb-4"}>
          <div className={"flex items-center justify-between"}>
            <div>
              <h2 className={"mb-1 flex items-center gap-2"}>
                <TimerIcon className={"size-6"} />
                <span className={"text-2xl font-bold"}>Latest Releases</span>
              </h2>
              <p className={"text-muted-foreground text-sm"}>Recently added services to our platform.</p>
            </div>
            <Button variant={"ghost"} asChild>
              <Link href={"/market/latest"}>
                <span>See More</span>
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
          <Separator className={"mt-4"} />
        </div>

        {/* No Items */}
        {latestServices.length === 0 && (
          <div className={"text-muted-foreground col-span-full my-10 text-center"}>
            No latest services available at the moment.
          </div>
        )}

        {/* With Items */}
        <Carousel opts={{ align: "start" }}>
          <CarouselContent>
            {latestServices.map((service) => (
              <CarouselItem
                key={service.id}
                className={"basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"}
              >
                <ServiceCard data={service} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className={"max-sm:hidden"} />
          <CarouselNext className={"max-sm:hidden"} />
        </Carousel>
      </div>
    </div>
  );
}
