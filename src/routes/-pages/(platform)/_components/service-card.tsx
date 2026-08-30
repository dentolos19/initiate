"use client";

import { CoinsIcon, StoreIcon } from "lucide-react";
import { ComponentProps } from "react";

import { Badge } from "#/components/ui/badge";
import ImageWrapper from "#/components/ui/wrappers/image";
import VerifiedBadge from "#/components/verified-badge";
import { Service } from "#/lib/backend/schema";
import Link from "#/lib/router";
import domains from "#/lib/store/domains";
import { cn, formatPrice, getLabel } from "#/lib/utils";

export default function ServiceCard(props: ComponentProps<"div"> & { data: Service; hideSimilarityScore?: boolean }) {
  const service = props.data;
  return (
    <Link
      className={cn("bg-card group flex flex-col overflow-hidden rounded-lg border shadow-lg", props.className)}
      href={`/services/${service.id}`}
    >
      <div className={"relative aspect-square overflow-hidden"}>
        {/* Image */}
        <ImageWrapper
          className={"size-full object-cover transition group-hover:scale-105"}
          src={service.imageUrl}
          alt={service.name}
        />

        {/* Similarity Score */}
        {service.similarity && !props.hideSimilarityScore && (
          <Badge className={"absolute top-2 right-2"} variant={"secondary"}>
            Matching {(service.similarity * 100).toFixed(0)}%
          </Badge>
        )}
      </div>
      <div className={"p-3"}>
        <div className={"flex justify-between"}>
          {/* Tag */}
          <Badge variant={"outline"}>{getLabel(domains, service.tags[0], "Unknown")}</Badge>

          {/* Verified Badge */}
          {service.verified && <VerifiedBadge />}
        </div>

        {/* Name */}
        <div>
          <h3 className={"truncate text-lg font-medium"}>{service.name}</h3>
        </div>

        {/* Statistics */}
        <div className={"mt-1 flex items-center justify-between text-xs"}>
          <div className={"flex items-center gap-1"}>
            <CoinsIcon className={"size-3"} />
            <span>{service.plan?.stripePriceData ? formatPrice(service.plan.stripePriceData) : "No Plan"}</span>
          </div>
          <div className={"flex items-center gap-1"}>
            <StoreIcon className={"size-3"} />
            <span>{service.orders} Orders</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
