"use client";

import { ChevronLeftIcon, ChevronRightIcon, HomeIcon, TagIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import useBackend from "#/lib/backend/client";
import { Service } from "#/lib/backend/schema";
import Link from "#/lib/router";
import { useParams, useRouter, useSearchParams } from "#/lib/router";
import domains from "#/lib/store/domains";
import { getLabel } from "#/lib/utils";
import ServiceCard from "#/routes/-pages/(platform)/_components/service-card";

export default function Page() {
  const backend = useBackend();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tagId = params.id as string;
  const tagData = domains.find((domain) => domain.value === tagId);
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<Service[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);

  function loadServices(page: number) {
    if (!tagId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    backend.market
      .servicesByTag(tagId, page, 24) // Load 24 services per page for better grid layout
      .then((services) => {
        setServices(services);
        setHasMore(services.length === 24); // If we get exactly 24, there might be more
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set("page", newPage.toString());
    }
    router.push(`/market/tags/${tagId}?${params.toString()}`);
  }

  useEffect(() => {
    loadServices(currentPage);
  }, [tagId, currentPage]);

  if (loading) {
    return (
      <div className={"my-20"}>
        <LoadingSpinner />
      </div>
    );
  }

  // Get domain info or fallback
  const domainIcon = tagData?.icon || TagIcon;
  const domainLabel =
    tagData?.label || getLabel(domains, tagId, tagId.charAt(0).toUpperCase() + tagId.slice(1).replace(/-/g, " "));
  const domainDescription =
    tagData?.description || `Services in the ${(domainLabel || "unknown").toLowerCase()} category`;

  return (
    <div className={"container mx-auto space-y-4 p-4"}>
      {/* Breadcrumb */}
      <nav className={"text-muted-foreground flex items-center space-x-2 text-sm"}>
        <Link href={"/market"} className={"hover:text-foreground flex items-center"}>
          <HomeIcon className={"mr-1 size-4"} />
          Market
        </Link>
        <span>/</span>
        <span className={"text-foreground"}>{domainLabel}</span>
      </nav>

      <Card>
        <CardContent>
          <div className={"mb-4 aspect-square w-max rounded-lg bg-blue-500 p-4 text-white"}>
            {React.createElement(domainIcon, { className: "size-8" })}
          </div>
          <h1 className={"mb-2 text-2xl font-medium"}>{domainLabel}</h1>
          <p className={"text-muted-foreground"}>{domainDescription}</p>
          {services.length > 0 && (
            <p className={"text-muted-foreground mt-2 text-sm"}>
              Showing {services.length} service{services.length !== 1 ? "s" : ""}
              {currentPage > 1 && ` on page ${currentPage}`}
            </p>
          )}
        </CardContent>
      </Card>

      {services.length === 0 ? (
        <div className={"text-muted-foreground my-20 text-center"}>No services found in this category yet.</div>
      ) : (
        <>
          <div className={"grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}>
            {services.map((service) => (
              <ServiceCard key={service.id} data={service} hideSimilarityScore />
            ))}
          </div>

          {/* Pagination */}
          {(currentPage > 1 || hasMore) && (
            <div className={"flex justify-center gap-2 pt-4"}>
              <Button variant={"outline"} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>
                <ChevronLeftIcon className={"size-4"} />
                Previous
              </Button>
              <span className={"text-muted-foreground flex items-center px-4 text-sm"}>Page {currentPage}</span>
              <Button variant={"outline"} onClick={() => handlePageChange(currentPage + 1)} disabled={!hasMore}>
                Next
                <ChevronRightIcon className={"size-4"} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
