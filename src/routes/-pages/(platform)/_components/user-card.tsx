import { HeartIcon } from "lucide-react";
import { ComponentProps } from "react";

import ImageWrapper from "#/components/ui/wrappers/image";
import { User } from "#/lib/backend/schema";
import Link from "#/lib/router";
import { cn } from "#/lib/utils";

export default function UserCard(props: ComponentProps<"div"> & { data: User }) {
  return (
    <Link
      className={cn("bg-card group overflow-hidden rounded-lg border", props.className)}
      href={`/users/${props.data.id}`}
    >
      {/* Image */}
      <div className={"aspect-square overflow-hidden"}>
        <ImageWrapper
          className={"size-full object-cover transition group-hover:scale-105"}
          src={props.data.imageUrl}
          alt={`${props.data.firstName} ${props.data.lastName}`}
        />
      </div>

      {/* Content */}
      <div className={"p-3"}>
        <div className={"flex items-center justify-between"}>
          <h3 className={"truncate font-medium"}>
            {props.data.firstName} {props.data.lastName}
          </h3>
          <p className={"flex items-center gap-1 text-xs"}>
            <HeartIcon className={"size-3"} />
            <span className={"font-bold"}>{props.data.followers}</span>
            <span>Followers</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
