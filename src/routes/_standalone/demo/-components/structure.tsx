import { AvatarFallback } from "@radix-ui/react-avatar";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { Avatar } from "#/components/ui/avatar";
import { AnimatedBeam } from "#/components/ui/magic/animated-beam";
import ImageWrapper from "#/components/ui/wrappers/image";
import { cn } from "#/lib/utils";

export default function Structure() {
  const target = useRef(null);

  const containerRef = useRef(null);
  const youRef = useRef(null);
  const centerRef = useRef(null);
  const them1Ref = useRef(null);
  const them2Ref = useRef(null);
  const them3Ref = useRef(null);

  const { scrollYProgress } = useScroll({ target });

  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], ["0%", "100%", "100%", "0%"]);

  return (
    <motion.section ref={target} className={"h-[300%]"} style={{ opacity }}>
      <div
        ref={containerRef}
        className={cn(
          "sticky top-1/2 -translate-y-1/2",
          "mx-auto flex justify-evenly gap-20 max-md:w-[80%] max-md:flex-col md:h-100",
        )}
      >
        <div className={"z-10 flex flex-col justify-center"}>
          <div className={"flex flex-col items-center justify-center gap-4"}>
            <Avatar ref={youRef} className={"size-16"}>
              <ImageWrapper src={"/assets/people/dennise.jpg"} avatar />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className={"font-mono text-lg font-medium"}>You</div>
          </div>
        </div>
        <div className={"z-10 flex items-center justify-center"}>
          <div className={"flex flex-col items-center justify-center gap-4"}>
            <Avatar ref={centerRef} className={"size-16"}>
              <ImageWrapper src={"/assets/logo.png"} avatar />
              <AvatarFallback>I</AvatarFallback>
            </Avatar>
            <div className={"font-mono text-lg font-medium"}>Initiate</div>
          </div>
        </div>
        <div className={"z-10 flex justify-between md:flex-col"}>
          <div className={"flex items-center gap-4 max-md:flex-col"}>
            <Avatar ref={them1Ref} className={"size-16"}>
              <ImageWrapper src={"/assets/logo.png"} avatar />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className={"font-mono text-lg font-medium"}>Startups</div>
          </div>
          <div className={"flex items-center gap-4 max-md:flex-col"}>
            <Avatar ref={them2Ref} className={"size-16"}>
              <ImageWrapper src={"/assets/logo.png"} avatar />
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
            <div className={"font-mono text-lg font-medium"}>Businesses</div>
          </div>
          <div className={"flex items-center gap-4 max-md:flex-col"}>
            <Avatar ref={them3Ref} className={"size-16"}>
              <ImageWrapper src={"/assets/logo.png"} avatar />
              <AvatarFallback>C</AvatarFallback>
            </Avatar>
            <div className={"font-mono text-lg font-medium"}>Investors</div>
          </div>
        </div>

        <AnimatedBeam containerRef={containerRef} fromRef={youRef} toRef={centerRef} />
        <AnimatedBeam containerRef={containerRef} fromRef={centerRef} toRef={them1Ref} />
        <AnimatedBeam containerRef={containerRef} fromRef={centerRef} toRef={them2Ref} />
        <AnimatedBeam containerRef={containerRef} fromRef={centerRef} toRef={them3Ref} />
      </div>
    </motion.section>
  );
}
