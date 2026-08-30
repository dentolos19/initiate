"use client";

import { BanknoteIcon, ScrollTextIcon } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { cn } from "#/lib/utils";

export default function Messaging() {
  const target = useRef(null);
  const { scrollYProgress } = useScroll({ target });

  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], ["0%", "100%", "100%", "0%"]);

  return (
    <motion.section ref={target} className={"h-[500%]"} style={{ opacity }}>
      <div className={cn("sticky top-1/2 -translate-y-1/2", "flex justify-center")}>
        <Card className={"w-100"}>
          <CardHeader>
            <CardTitle>Virage POC</CardTitle>
            <CardDescription>Online</CardDescription>
          </CardHeader>
          <CardContent className={"flex-1"}>
            <div className={"flex flex-col gap-2"}>
              <div className={"bg-muted w-max max-w-[80%] rounded-lg p-3"}>Let agree on this deal?</div>
              <div className={"bg-primary text-primary-foreground w-max max-w-[80%] self-end rounded-lg p-3"}>
                Yes, please!
              </div>
              <div className={"bg-muted w-max max-w-[80%] rounded-lg p-3"}>
                <div className={"mb-3 text-3xl font-medium"}>S$1000</div>
                <div className={"flex gap-2"}>
                  <Button variant={"default"} size={"sm"} disabled title={"Static payment preview"}>
                    <BanknoteIcon />
                    <span>Pay</span>
                  </Button>
                  <Button variant={"outline"} size={"sm"} disabled title={"Static invoice preview"}>
                    <ScrollTextIcon />
                    <span>View Invoice</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.section>
  );
}
