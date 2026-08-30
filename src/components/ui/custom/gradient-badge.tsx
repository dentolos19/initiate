import { AnimatedGradientText } from "#/components/ui/magic/animated-gradient-text";
import { cn } from "#/lib/utils";
import { ReactNode } from "react";

export default function GradientBadge(props: { children?: ReactNode }) {
  return (
    <div
      className={
        "group bg-background relative flex w-max items-center justify-center rounded-full px-4 py-1.5 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f]"
      }
    >
      <span
        className={cn(
          "animate-gradient absolute inset-0 block h-full w-full rounded-[inherit] bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:300%_100%] p-[1px]",
        )}
        style={{
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "destination-out",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "subtract",
          WebkitClipPath: "padding-box",
        }}
      />
      {/* 🎉 <hr className="mx-2 h-4 w-px shrink-0 bg-neutral-500" />
      <AnimatedGradientText className="text-sm font-medium">Introducing Magic UI</AnimatedGradientText>
      <ChevronRightIcon className="ml-1 size-4 stroke-neutral-500 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" /> */}
      <AnimatedGradientText className="text-sm font-medium">{props.children}</AnimatedGradientText>
    </div>
  );
}