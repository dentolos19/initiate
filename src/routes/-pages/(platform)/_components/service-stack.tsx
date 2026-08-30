import { CoinsIcon, FlipHorizontalIcon, HeartIcon, StoreIcon } from "lucide-react";
import { ComponentProps } from "react";

import ImageWrapper from "#/components/ui/wrappers/image";
import VerifiedBadge from "#/components/verified-badge";
import { Service } from "#/lib/backend/schema";
import Link from "#/lib/router";
import { cn, formatPrice } from "#/lib/utils";

export default function ServiceStack(props: ComponentProps<"a"> & { data: Service }) {
  const service = props.data;
  return (
    <Link
      {...props}
      className={cn("bg-card group flex overflow-hidden rounded-lg border shadow-lg", props.className)}
      href={`/services/${service.id}`}
    >
      <div className={"relative aspect-square overflow-hidden"}>
        {/* Image */}
        <ImageWrapper
          className={"size-full object-cover transition group-hover:scale-105"}
          src={service.imageUrl}
          alt={service.name}
        />
      </div>
      <div className={"flex flex-1 flex-col p-4"}>
        <div className={"flex flex-1"}>
          {/* Name */}
          <div className={"flex-1"}>
            <h3 className={"text-2xl font-bold"}>{service.name}</h3>
            <p className={"text-muted-foreground text-sm"}>{service.tagline || "No tagline available."}</p>
          </div>

          {/* Verified Badge */}
          {service.verified && <VerifiedBadge />}
        </div>

        {/* Statistics */}
        <div className={"flex items-center gap-2 text-xs"}>
          <div className={"flex items-center gap-1"}>
            <CoinsIcon className={"size-3"} />
            <span>{service.plan?.stripePriceData ? formatPrice(service.plan.stripePriceData) : "Unknown"}</span>
          </div>
          <div className={"flex items-center gap-1"}>
            <StoreIcon className={"size-3"} />
            <span>{service.orders} Orders</span>
          </div>
          <div className={"flex items-center gap-1"}>
            <HeartIcon className={"size-3"} />
            <span>{service?.likes} Likes</span>
          </div>
          {service.similarity && (
            <div className={"flex items-center gap-1"}>
              <FlipHorizontalIcon className={"size-3"} />
              <span>Matching {(service.similarity * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
