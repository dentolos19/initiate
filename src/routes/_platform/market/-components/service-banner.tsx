import { ComponentProps } from "react";

import { Badge } from "#/components/ui/badge";
import { CarouselItem } from "#/components/ui/carousel";
import GradientBadge from "#/components/ui/custom/gradient-badge";
import ImageWrapper from "#/components/ui/wrappers/image";
import { Service } from "#/lib/backend/schema";
import Link from "#/lib/router";
import domains from "#/lib/store/domains";
import { cn, getLabel } from "#/lib/utils";

export default function ServiceBanner(props: ComponentProps<"div"> & { data: Service }) {
  return (
    <CarouselItem>
      <Link
        className={cn("group relative block overflow-hidden rounded-lg", props.className)}
        href={`/services/${props.data.id}`}
      >
        {/* Background */}
        <ImageWrapper
          className={"size-full object-cover transition group-hover:scale-105 dark:brightness-75"}
          src={props.data.bannerUrl}
          alt={props.data.name}
        />

        {/* Details */}
        <div
          className={cn(
            "absolute inset-0",
            "flex flex-col justify-end p-6",
            "dark from-background via-background/40 bg-gradient-to-t to-transparent",
          )}
        >
          {/* Tags */}
          <div className={"mb-1"}>
            <Badge variant={"outline"}>
              {getLabel(domains, props.data.tags[0], props.data.tags[0] ?? "Uncategorized")}
            </Badge>
          </div>

          {/* Name and Tagline */}
          <h3 className={"text-4xl font-bold text-white md:text-6xl"}>{props.data.name}</h3>
          <p className={"mt-2 text-gray-400 md:text-lg"}>{props.data.tagline ?? "Discover an amazing service."}</p>
        </div>

        {/* Badges */}
        <div className={"absolute inset-4"}>
          <GradientBadge>Recommended For You</GradientBadge>
        </div>
      </Link>
    </CarouselItem>
  );
}
