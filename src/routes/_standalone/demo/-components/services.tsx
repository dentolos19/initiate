import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";

import { Card, CardContent } from "#/components/ui/card";
import ImageWrapper from "#/components/ui/wrappers/image";
import { cn } from "#/lib/utils";

export default function Services() {
  const target = useRef(null);
  const { scrollYProgress } = useScroll({ target });

  const [hideText, setHideText] = useState<boolean>(true);

  const sectionPpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], ["0%", "100%", "100%", "0%"]);
  const sliderWidth = useTransform(scrollYProgress, [0.15, 0.3], ["0px", "500px"]);
  const textOpacity = useTransform(scrollYProgress, [0.3, 0.4], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setHideText(latest < 0.3 ? true : false);
  });

  return (
    <motion.section ref={target} className={"h-[500%]"} style={{ opacity: sectionPpacity }}>
      <div className={cn("sticky top-1/2 -translate-y-1/2", "flex justify-center gap-8")}>
        <div className={"bg-muted/50 flex rounded-lg border"}>
          <Card className={"w-60 gap-0 overflow-hidden p-0"}>
            <ImageWrapper src={"https://nyptech.club/assets/startups/virage.png"} alt={"Virage"} />
            <CardContent className={"py-4"}>
              <h2 className={"mb-1 font-medium"}>Virage</h2>
              <p className={"text-muted-foreground text-sm"}>
                A vishing simulation platform designed for educational purposes.
              </p>
            </CardContent>
          </Card>
          <motion.div style={{ width: sliderWidth }}>
            <motion.div
              className={cn("flex-col justify-center gap-4 p-4", hideText && "hidden")}
              style={{ opacity: textOpacity }}
            >
              <h2 className={"text-lg font-bold"}>Here's why our AI thinks this matches you!</h2>
              <p className={"text-muted-foreground text-sm"}>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti, id mollitia. Unde ex ipsa
                reprehenderit inventore doloremque mollitia ut nulla officia molestias quis fuga, autem nihil, sequi
                laborum veritatis sapiente.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
