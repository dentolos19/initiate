"use client";

import { CheckCircle2Icon } from "lucide-react";
import { ComponentProps } from "react";

import { Button } from "#/components/ui/button";
import { CarouselItem } from "#/components/ui/carousel";
import ImageWrapper from "#/components/ui/wrappers/image";
import { useAdvisor } from "#/lib/providers/advisor";
import { cn } from "#/lib/utils";

export default function AmplifyBanner(props: ComponentProps<"div">) {
  const { askAdvisor } = useAdvisor();

  function handleStart() {
    askAdvisor("I want to grow my business with AI tools and expert support.");
  }

  return (
    <CarouselItem>
      <div className={cn("group relative overflow-hidden rounded-xl", props.className)}>
        {/* Background */}
        <ImageWrapper
          className={
            "size-full object-cover brightness-[0.28] transition duration-700 ease-out group-hover:scale-[1.025]"
          }
          src={"/assets/cta-light.jpg"}
          alt={""}
        />

        {/* Content */}
        <div className={"dark absolute inset-0 flex flex-col items-center justify-center p-6 text-center"}>
          <h1 className={"max-w-4xl text-4xl font-semibold tracking-[-0.035em] text-balance text-white md:text-6xl"}>
            Turn the next business challenge into forward motion.
          </h1>
          <p className={"mt-5 max-w-2xl text-sm leading-6 text-blue-50/85 md:text-lg"}>
            Find practical services, experienced collaborators, and relevant support in one place.
          </p>
          <Button className={"mt-7"} size={"lg"} onClick={handleStart}>
            Ask the AI advisor
          </Button>
          <div className={"mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-blue-50/80"}>
            {["Practical AI services", "Experienced operators", "Founder community"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2Icon className="size-4" aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </CarouselItem>
  );
}
