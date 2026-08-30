import { HeartIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import useBackend from "#/lib/backend/client";
import { Service } from "#/lib/backend/schema";
import Link from "#/lib/router";
import ServiceStack from "#/routes/_platform/-components/service-stack";

export default function LikesTab() {
  const backend = useBackend();

  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<Service[]>([]);

  function loadServices() {
    setLoading(true);
    backend.user
      .getUserServices("current")
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
  }

  useEffect(() => {
    loadServices();
  }, []);

  if (loading) {
    return (
      <div className={"my-20"}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div>
        <div className={"text-muted-foreground my-20 text-center"}>
          <HeartIcon className={"mx-auto mb-4 size-12"} />
          <h3 className={"mb-2 text-lg font-medium"}>No liked services yet</h3>
          <p className={"text-sm"}>
            <span>Discover and like services to see them here. Browse the </span>
            <Link href={"/market"} className={"text-primary underline"}>
              marketplace
            </Link>
            <span> to find services you love.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={"p-4"}>
      {services.map((service) => (
        <ServiceStack key={service.id} className={"h-40"} data={service} />
      ))}
    </div>
  );
}
