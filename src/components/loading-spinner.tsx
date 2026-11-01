import { Loader2Icon } from "lucide-react";
import { ComponentProps } from "react";

import { cn } from "#/lib/utils";

export default function LoadingSpinner(
  props: ComponentProps<"div"> & {
    size?: "sm" | "md" | "lg";
  },
) {
  const size = props.size === "sm" ? "size-4" : props.size === "lg" ? "size-8" : "size-6";

  return (
    <div {...props} className={cn("mx-auto size-min animate-spin motion-reduce:animate-none", props.className)}>
      <Loader2Icon className={size} aria-hidden="true" />
    </div>
  );
}
