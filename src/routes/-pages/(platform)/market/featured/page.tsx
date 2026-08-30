"use client";

import { PencilRulerIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Card, CardContent } from "#/components/ui/card";
import useBackend from "#/lib/backend/client";
import { Service } from "#/lib/backend/schema";
import ServiceCard from "#/routes/-pages/(platform)/_components/service-card";

export default function Page() {
  const backend = useBackend();

  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    backend.service
      .relevantServices()
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
    <div className={"my-20"}>
      <LoadingSpinner />
    </div>;
  }

  return (
    <div className={"container mx-auto space-y-2 p-4"}>
      <Card>
        <CardContent>
          <div className={"mb-4 aspect-square w-max rounded-lg bg-purple-500 p-4 text-white"}>
            <PencilRulerIcon className={"size-8"} />
          </div>
          <h1 className={"mb-2 text-2xl font-medium"}>Recommended Services</h1>
          <p className={"text-muted-foreground"}>Explore services matched to your profile and interests.</p>
        </CardContent>
      </Card>
      <div className={"grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}>
        {services.map((service) => (
          <ServiceCard key={service.id} data={service} hideSimilarityScore />
        ))}
      </div>
    </div>
  );
}
