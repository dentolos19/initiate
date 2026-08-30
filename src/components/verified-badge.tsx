import { TriangleIcon } from "lucide-react";
import { ComponentProps } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip";
import { cn } from "#/lib/utils";

export default function VerifiedBadge(props: ComponentProps<"div">) {
  return (
    <Tooltip>
      <TooltipTrigger className={"size-max"}>
        <div className={cn("bg-primary grid size-6 place-content-center rounded-sm", props.className)}>
          <TriangleIcon className={"size-3"} />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className={"flex items-center gap-2"}>
          <TriangleIcon className={"size-4"} />
          <span className={"text-sm font-semibold"}>Verified</span>
        </div>
        <p className={"text-xs"}>The seller has been verified by our team.</p>
      </TooltipContent>
    </Tooltip>
  );
}
