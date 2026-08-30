import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";

import { Skeleton } from "#/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/ui/table";
import Image from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { Comparison } from "#/lib/backend/connectors/market";
import { Service } from "#/lib/backend/schema";
import Link from "#/lib/router";
import { useSearchParams } from "#/lib/router";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/_platform/services/compare/")({ component: Page });

export default function Page() {
  const backend = useBackend();
  const searchParams = useSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState<boolean>(true);
  const [comparison, setComparison] = useState<Comparison>();
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(true);

  function generateComparison(ids: string[]) {
    setServicesLoading(true);
    setServices([]);
    setComparisonLoading(true);
    setComparison(undefined);

    if (!ids || ids.length === 0) {
      setServicesLoading(false);
      setComparisonLoading(false);
      return;
    }

    // Load services
    Promise.all(ids.map((id) => backend.service.getService(id)))
      .then((services) => {
        setServices(services);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setServicesLoading(false);
      });

    if (ids.length < 2) {
      setComparisonLoading(false);
    } else {
      backend.market
        .compareServices(ids)
        .then((comparisonData) => {
          setComparison(comparisonData);
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        })
        .finally(() => {
          setComparisonLoading(false);
        });
    }
  }

  function removeService(id: string) {
    if (comparisonLoading) {
      toast.error("Comparison is still loading, please wait.");
      return;
    }

    const ids = services.map((service) => service.id).filter((serviceId) => serviceId !== id);
    localStorage.setItem("comparisonIds", JSON.stringify(ids));
    toast.success("Service removed from comparison.");

    generateComparison(ids);
  }

  useEffect(() => {
    const ids = new Set<string>(JSON.parse(localStorage.getItem("comparisonIds") || "[]") as string[]);

    const id = searchParams.get("id");
    if (id) {
      if (!ids.has(id) && ids.size >= 5) {
        toast.error("You can only compare up to 5 services at a time.");
        return;
      }

      ids.add(id);
    }

    const serviceIds = Array.from(ids);
    localStorage.setItem("comparisonIds", JSON.stringify(serviceIds));

    generateComparison(serviceIds);
  }, []);

  return (
    <div className={"w-full space-y-4 p-4 sm:p-6"}>
      <div className={"grid grid-cols-5 gap-4"}>
        {services.map((service) => (
          <button
            key={service.id}
            className={"group bg-card relative aspect-square overflow-hidden rounded-lg"}
            onClick={() => removeService(service.id)}
          >
            <Image className={"size-full"} src={service.imageUrl} alt={service.name} />
            <div
              className={cn(
                "absolute inset-0",
                "flex size-full items-end justify-start p-4",
                "dark from-background via-background/40 bg-gradient-to-t to-transparent",
              )}
            >
              <h2 className={"text-lg font-bold"}>{service.name}</h2>
            </div>
            <div
              className={
                "bg-card/50 absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
              }
            >
              <TrashIcon className={"mb-2 size-8"} />
              <span>Remove</span>
            </div>
          </button>
        ))}

        {!servicesLoading && services.length >= 0 && services.length < 5 && (
          <Link
            className={"bg-card hover:bg-card/80 flex aspect-square flex-col items-center justify-center rounded-lg"}
            href={"/market"}
          >
            <PlusIcon className={"mb-2 size-8"} />
            <span>Add Service</span>
          </Link>
        )}

        {servicesLoading &&
          Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className={"aspect-square"} />)}
      </div>
      {comparisonLoading ? (
        <Table className={"bg-card overflow-hidden rounded-lg"}>
          <TableHeader>
            <TableRow>
              <TableHead>Feature</TableHead>
              {services.map((service) => (
                <TableHead key={service.id}>
                  <Skeleton className={"h-4 w-20"} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, categoryIndex) => (
              <Fragment key={categoryIndex}>
                <TableRow className={"bg-secondary"}>
                  <TableHead className={"text-center"} colSpan={100}>
                    <Skeleton className={"mx-auto h-4 w-32"} />
                  </TableHead>
                </TableRow>
                {Array.from({ length: 4 }).map((_, featureIndex) => (
                  <TableRow key={`${categoryIndex}-${featureIndex}`}>
                    <TableCell>
                      <Skeleton className={"h-4 w-24"} />
                    </TableCell>
                    {services.map((service) => (
                      <TableCell key={service.id}>
                        <Skeleton className={"h-4 w-16"} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      ) : comparison ? (
        <Table className={"bg-card overflow-hidden rounded-lg"}>
          <TableHeader>
            <TableRow>
              <TableHead>Feature</TableHead>
              {comparison.services.map((service) => (
                <TableHead key={service.id}>{service.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparison.categories.map((category) => (
              <Fragment key={category.name}>
                <TableRow className={"bg-secondary"}>
                  <TableHead className={"text-center"} colSpan={100}>
                    {category.name}
                  </TableHead>
                </TableRow>
                {category.features.map((feature) => (
                  <TableRow key={feature.name}>
                    <TableCell>{feature.name}</TableCell>
                    {feature.values.map((value, index) => (
                      <TableCell key={index}>{value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  );
}
