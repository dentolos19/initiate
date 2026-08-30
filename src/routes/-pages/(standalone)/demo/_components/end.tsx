"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { Button } from "#/components/ui/button";
import Link from "#/lib/router";
import { cn } from "#/lib/utils";

export default function End() {
  const target = useRef(null);

  const { scrollYProgress } = useScroll({ target, offset: ["start end", "end end"] });

  const opacity = useTransform(scrollYProgress, [0, 0.6], ["0%", "100%"]);

  return (
    <motion.section ref={target} className={"h-[100%]"} style={{ opacity }}>
      <div className={cn("sticky top-1/2 -translate-y-1/2", "flex justify-center")}>
        <div className={"max-w-2xl text-center"}>
          <h2 className={"mb-2 font-mono text-4xl font-bold"}>Let's Initiate!</h2>
          <p className={"text-muted-foreground"}>
            Join the platform for connecting startups, investors, and businesses alike in one place! Be a pioneer in
            this community.
          </p>
          <div className={"mt-4 flex justify-center gap-2"}>
            <Button variant={"default"} asChild>
              <Link href={"/auth/new"}>Sign Up</Link>
            </Button>
            <Button variant={"outline"}>
              <Link href={"/demo"}>Try Demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
