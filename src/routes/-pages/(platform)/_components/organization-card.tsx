import { HeartIcon } from "lucide-react";
import { ComponentProps } from "react";

import { Badge } from "#/components/ui/badge";
import ImageWrapper from "#/components/ui/wrappers/image";
import { Organization } from "#/lib/backend/schema";
import Link from "#/lib/router";
import industries from "#/lib/store/industries";
import { cn, getLabel } from "#/lib/utils";

export default function OrganizationCard(props: ComponentProps<"div"> & { data: Organization }) {
  return (
    <Link
      className={cn("bg-card group overflow-hidden rounded-lg border", props.className)}
      href={`/organizations/${props.data.id}`}
    >
      {/* Image */}
      <div className={"aspect-square overflow-hidden"}>
        <ImageWrapper
          className={"size-full object-cover transition group-hover:scale-105"}
          src={props.data.imageUrl}
          alt={props.data.name}
        />
      </div>

      {/* Content */}
      <div className={"p-3"}>
        {/* Badges */}
        <div className={"mb-1"}>
          <Badge variant={"outline"}>{getLabel(industries, props.data.tags[0], "Unknown")}</Badge>
        </div>

        {/* Name and Likes */}
        <div className={"flex items-center justify-between"}>
          <h3 className={"truncate font-medium"}>{props.data.name}</h3>
          <p className={"flex items-center gap-1 text-xs"}>
            <HeartIcon className={"size-3"} />
            <span className={"font-bold"}>{props.data.likes}</span>
            <span>Likes</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
