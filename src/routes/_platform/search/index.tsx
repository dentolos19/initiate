import { createFileRoute } from "@tanstack/react-router";
import { EyeIcon, SparklesIcon } from "lucide-react";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { Service } from "#/lib/backend/schema";
import { useAdvisor } from "#/lib/providers/advisor";
import Link from "#/lib/router";
import { useRouter, useSearchParams } from "#/lib/router";
import domains from "#/lib/store/domains";
import { getLabel } from "#/lib/utils";
import SearchOrganizations from "#/routes/_platform/search/-components/search-organization";
import SearchServices from "#/routes/_platform/search/-components/search-services";
import SearchUsers from "#/routes/_platform/search/-components/search-users";

export const Route = createFileRoute("/_platform/search/")({ component: Page });

export default function Page() {
  const backend = useBackend();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { askAdvisor } = useAdvisor();

  const query = searchParams.get("query") as string;
  const tab = (searchParams.get("tab") as string) ?? "services";

  const [serviceLoading, setServiceLoading] = useState<boolean>(false);
  const [service, setService] = useState<Service>();

  function setTab(value: string) {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("tab", value);

    router.push(`?${newSearchParams.toString()}`);
  }

  function askAI(service: Service) {
    askAdvisor(`Can you help me understand more about the service "${service.name}"?`);
  }

  useEffect(() => {
    if (!query) return;
    setServiceLoading(true);
    backend.market
      .curateServices(query)
      .then((service) => {
        setService(service);
      })
      .catch(() => setService(undefined))
      .finally(() => {
        setServiceLoading(false);
      });
  }, [query]);

  return (
    <div className={"w-full space-y-2 p-4 sm:p-6"}>
      {/* Curator Loading */}
      {serviceLoading && (
        <div className={"bg-card flex h-auto flex-col rounded-lg border-b md:h-40 md:flex-row"}>
          <Skeleton className={"aspect-square h-40 w-full md:h-full md:w-auto"} />
          <div className={"flex flex-1 flex-col justify-between p-4"}>
            <div>
              <Skeleton className={"mb-2 h-6 w-full max-w-80"} />
              <Skeleton className={"mb-4 h-4 w-full max-w-40"} />
            </div>
            <div>
              <Skeleton className={"h-8 w-full"} />
            </div>
          </div>
        </div>
      )}

      {/* Curated Result */}
      {!serviceLoading && service && (
        <div className={"bg-card flex flex-col overflow-hidden rounded-lg border md:flex-row"}>
          <ImageWrapper className={"aspect-square h-auto w-full md:w-50"} src={service.imageUrl} alt={"Image"} />
          <div className={"flex flex-1 flex-col justify-between gap-2 p-4"}>
            <div className={"flex flex-col gap-4 lg:flex-row lg:justify-between"}>
              <div className={"flex-1"}>
                <h2 className={"mb-1 text-lg font-bold"}>{service.name}</h2>
                <div className={"mb-2 flex flex-wrap gap-1"}>
                  {service.tags.map((tag) => (
                    <Badge key={tag} variant={"outline"}>
                      {getLabel(domains, tag, tag || "Uncategorized")}
                    </Badge>
                  ))}
                </div>
                <p className={"text-muted-foreground"}>{service.tagline ?? "No tagline provided."}</p>
              </div>
              <div className={"flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row"}>
                <Button variant={"default"} onClick={() => askAI(service)} className={"w-full sm:w-auto"}>
                  <SparklesIcon />
                  <span>Ask AI</span>
                </Button>
                <Button variant={"outline"} asChild className={"w-full sm:w-auto"}>
                  <Link href={`/services/${service.id}`}>
                    <EyeIcon />
                    <span>View Service</span>
                  </Link>
                </Button>
              </div>
            </div>
            <Alert>
              <SparklesIcon />
              <AlertTitle>I have curated this service for you!</AlertTitle>
              <AlertDescription>
                <div className={"prose prose-sm dark:prose-invert max-w-none"}>
                  <Markdown>{service.summary}</Markdown>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={(value) => setTab(value)}>
        <TabsList className={"bg-card w-full border-b"}>
          <TabsTrigger value={"services"}>Services</TabsTrigger>
          <TabsTrigger value={"organizations"}>Organizations</TabsTrigger>
          <TabsTrigger value={"users"}>Users</TabsTrigger>
        </TabsList>

        {/* Service Results */}
        <TabsContent value={"services"}>
          <SearchServices />
        </TabsContent>

        {/* Organizations Results */}
        <TabsContent value={"organizations"}>
          <SearchOrganizations />
        </TabsContent>

        {/* Users Results */}
        <TabsContent value={"users"}>
          <SearchUsers />
        </TabsContent>
      </Tabs>
    </div>
  );
}
