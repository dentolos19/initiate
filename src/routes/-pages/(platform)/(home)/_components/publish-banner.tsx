"use client";

import { CheckCircle2Icon } from "lucide-react";
import { ComponentProps } from "react";

import { Button } from "#/components/ui/button";
import { CarouselItem } from "#/components/ui/carousel";
import ImageWrapper from "#/components/ui/wrappers/image";
import Link from "#/lib/router";
import { cn } from "#/lib/utils";

export default function PublishBanner(props: ComponentProps<"div">) {
  return (
    <CarouselItem>
      <div className={cn("group relative overflow-hidden rounded-xl", props.className)}>
        {/* Background */}
        <ImageWrapper
          className={
            "size-full object-cover brightness-[0.28] transition duration-700 ease-out group-hover:scale-[1.025]"
          }
          src={"/assets/cta-dark.jpg"}
          alt={""}
        />

        {/* Content */}
        <div className={"dark absolute inset-0 flex flex-col items-center justify-center p-6 text-center"}>
          <h2 className={"max-w-4xl text-4xl font-semibold tracking-[-0.035em] text-balance text-white md:text-6xl"}>
            Put your expertise where ambitious teams can find it.
          </h2>
          <p className={"mt-5 max-w-2xl text-sm leading-6 text-blue-50/85 md:text-lg"}>
            Publish a clear service offer, meet potential clients, and build trust through real work and reviews.
          </p>
          <Button className={"mt-7"} size={"lg"} asChild>
            <Link href={"/manage/organization/services"}>Publish a service</Link>
          </Button>
          <div className={"mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-blue-50/80"}>
            {["Clear service plans", "Verified reviews", "Direct client conversations"].map((item) => (
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
