import { Loader2Icon } from "lucide-react";
import { ComponentProps } from "react";

import { cn } from "#/lib/utils";

export default function LoadingSpinner(
  props: ComponentProps<"div"> & {
    size?: "sm" | "md" | "lg";
  },
) {
  let size = "size-6";

  switch (props.size) {
    case "sm":
      size = "size-4";
      break;
    case "lg":
      size = "size-8";
      break;
    default:
      size = "size-6";
      break;
  }

  return (
    <div {...props} className={cn("mx-auto size-min animate-spin motion-reduce:animate-none", props.className)}>
      <Loader2Icon className={size} aria-hidden="true" />
    </div>
  );
}
