"use client";

import {
  ArrowRightIcon,
  BotIcon,
  GlobeIcon,
  PlusIcon,
  SparklesIcon,
  StoreIcon,
  TimerIcon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "#/components/ui/carousel";
import { Skeleton } from "#/components/ui/skeleton";
import useBackend from "#/lib/backend/client";
import type { Service } from "#/lib/backend/schema";
import { useAdvisor } from "#/lib/providers/advisor";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import AmplifyBanner from "#/routes/-pages/(platform)/(home)/_components/amplify-banner";
import PublishBanner from "#/routes/-pages/(platform)/(home)/_components/publish-banner";
import ServiceCard from "#/routes/-pages/(platform)/_components/service-card";

const pathways = [
  {
    description: "Browse practical AI and business services from the marketplace.",
    href: "/market",
    icon: StoreIcon,
    label: "Explore services",
  },
  {
    description: "Meet peers, share a challenge, and learn from active builders.",
    href: "/community",
    icon: UsersIcon,
    label: "Join the community",
  },
  {
    description: "Find grants, documentation, and support for your next step.",
    href: "/resources",
    icon: GlobeIcon,
    label: "Find resources",
  },
  {
    description: "List your expertise and make it discoverable to new clients.",
    href: "/manage/organization/services",
    icon: PlusIcon,
    label: "Publish a service",
  },
];

export default function Page() {
  const backend = useBackend();
  const session = useSession();
  const { showAdvisorPopover } = useAdvisor();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  const [latestServices, setLatestServices] = useState<Service[]>([]);

  useEffect(() => {
    Promise.all([backend.service.popularServices(), backend.service.latestServices()])
      .then(([popular, latest]) => {
        setPopularServices(popular);
        setLatestServices(latest);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:space-y-14 lg:py-10">
      {session.user && !session.user.location ? (
        <Link className="block" href="/onboarding">
          <Alert className="bg-primary/5 hover:bg-primary/8 border-primary/20 transition-colors">
            <SparklesIcon />
            <AlertTitle>Complete your profile</AlertTitle>
            <AlertDescription>
              Add your location and interests so Initiate can surface more relevant opportunities.
            </AlertDescription>
          </Alert>
        </Link>
      ) : null}

      <Carousel className="group" opts={{ loop: true }}>
        <CarouselContent>
          <AmplifyBanner className="h-[24rem] md:h-[30rem]" />
          <PublishBanner className="h-[24rem] md:h-[30rem]" />
        </CarouselContent>
        <CarouselPrevious className="left-4 hidden border-white/20 bg-black/35 text-white hover:bg-black/55 hover:text-white sm:inline-flex" />
        <CarouselNext className="right-4 hidden border-white/20 bg-black/35 text-white hover:bg-black/55 hover:text-white sm:inline-flex" />
      </Carousel>

      <section aria-labelledby="next-move-heading">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 id="next-move-heading" className="text-2xl font-semibold tracking-tight md:text-3xl">
              Choose your next move
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6 sm:text-base">
              Start with a clear path, or ask the advisor when you need help narrowing the options.
            </p>
          </div>
          <Button variant="outline" onClick={showAdvisorPopover}>
            <BotIcon />
            Ask the advisor
          </Button>
        </div>

        <Card className="gap-0 overflow-hidden py-0 shadow-sm">
          <CardContent className="grid p-0 sm:grid-cols-2 lg:grid-cols-4">
            {pathways.map((pathway) => {
              const Icon = pathway.icon;
              return (
                <Link
                  key={pathway.href}
                  className="hover:bg-accent/60 focus-visible:ring-ring group relative flex min-h-44 flex-col p-6 transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none [&:not(:last-child)]:border-b lg:[&:not(:last-child)]:border-r sm:[&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0 sm:[&:nth-child(odd)]:border-r"
                  href={pathway.href}
                >
                  <Icon className="text-primary size-5" aria-hidden="true" />
                  <h3 className="mt-8 font-medium">{pathway.label}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">{pathway.description}</p>
                  <ArrowRightIcon
                    className="text-muted-foreground mt-auto size-4 translate-x-0 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Services could not be loaded</AlertTitle>
          <AlertDescription>{error} Refresh the page to try again.</AlertDescription>
        </Alert>
      ) : null}

      <ServiceRail
        description="The services receiving the most interest across Initiate right now."
        empty="No popular services are available yet."
        href="/market/popular"
        icon={<StoreIcon />}
        loading={loading}
        services={popularServices}
        title="Popular services"
      />

      <ServiceRail
        description="New expertise and solutions recently added by the community."
        empty="No new services are available yet."
        href="/market/latest"
        icon={<TimerIcon />}
        loading={loading}
        services={latestServices}
        title="Latest releases"
      />
    </main>
  );
}

function ServiceRail({
  description,
  empty,
  href,
  icon,
  loading,
  services,
  title,
}: {
  description: string;
  empty: string;
  href: string;
  icon: ReactNode;
  loading: boolean;
  services: Service[];
  title: string;
}) {
  return (
    <section aria-labelledby={`${title.replaceAll(" ", "-")}-heading`}>
      <div className="mb-5 flex items-end justify-between gap-4 border-b pb-5">
        <div>
          <h2
            id={`${title.replaceAll(" ", "-")}-heading`}
            className="flex items-center gap-2 text-2xl font-semibold tracking-tight"
          >
            <span className="text-primary [&>svg]:size-5">{icon}</span>
            {title}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">{description}</p>
        </div>
        <Button variant="ghost" asChild>
          <Link href={href}>
            View all
            <ArrowRightIcon />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/5] rounded-xl" />
          ))}
        </div>
      ) : services.length ? (
        <Carousel opts={{ align: "start" }}>
          <CarouselContent>
            {services.map((service) => (
              <CarouselItem key={service.id} className="basis-1/2 sm:basis-1/3 lg:basis-1/5">
                <ServiceCard data={service} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:inline-flex" />
          <CarouselNext className="hidden sm:inline-flex" />
        </Carousel>
      ) : (
        <div className="bg-muted/45 text-muted-foreground grid min-h-36 place-items-center rounded-xl border border-dashed px-6 text-center text-sm">
          {empty}
        </div>
      )}
    </section>
  );
}
