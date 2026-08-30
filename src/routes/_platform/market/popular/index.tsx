import { createFileRoute } from "@tanstack/react-router";
import { TrendingUpIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import useBackend from "#/lib/backend/client";
import { Service } from "#/lib/backend/schema";
import ServiceCard from "#/routes/_platform/-components/service-card";

export const Route = createFileRoute("/_platform/market/popular/")({ component: Page });

export default function Page() {
  const backend = useBackend();

  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    backend.service
      .popularServices()
      .then((services) => {
        setServices(services);
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={"my-20"}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={"w-full space-y-4 p-4 sm:p-6"}>
      <header className="flex items-start gap-3 border-b pb-5">
        <TrendingUpIcon className="text-primary mt-1 size-5" aria-hidden="true" />
        <div>
          <h1 className={"text-2xl font-semibold tracking-tight text-balance"}>Popular Services</h1>
          <p className={"text-muted-foreground"}>Discover the most popular and trending services on our platform.</p>
        </div>
      </header>
      <div className={"grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}>
        {services.map((service) => (
          <ServiceCard key={service.id} data={service} hideSimilarityScore />
        ))}
      </div>
    </div>
  );
}
