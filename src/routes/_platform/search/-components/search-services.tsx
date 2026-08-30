import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import useBackend from "#/lib/backend/client";
import { Service } from "#/lib/backend/schema";
import { useSearchParams } from "#/lib/router";
import ServiceCard from "#/routes/_platform/-components/service-card";

export default function SearchServices() {
  const backend = useBackend();
  const searchParams = useSearchParams();

  const query = searchParams.get("query") as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    backend.service
      .searchServices(query)
      .then((data) => {
        setServices(data);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query]);

  if (loading) {
    return (
      <div className={"my-10 text-center"}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!query) {
    return <div className={"text-muted-foreground my-10 text-center"}>Search something to get started!</div>;
  }

  if (!services.length) {
    return <div className={"text-muted-foreground my-10 text-center"}>No services found.</div>;
  }

  return (
    <div className={"grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}>
      {services.map((service) => (
        <ServiceCard key={service.id} data={service} />
      ))}
    </div>
  );
}
