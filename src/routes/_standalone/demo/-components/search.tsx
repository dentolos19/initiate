import { motion, MotionValue, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { cn } from "#/lib/utils";

function Word(props: { index: number; word: string; totalWords: number; progress: MotionValue<number> }) {
  const start = props.index / props.totalWords;
  const end = start + 1 / props.totalWords;

  const opacity = useTransform(props.progress, [start, end], [0, 1]);

  return <motion.span style={{ opacity: opacity }}>{props.word}</motion.span>;
}

export default function Search(props: { text: string }) {
  const target = useRef(null);
  const { scrollYProgress } = useScroll({ target: target, offset: ["start start", "end end"] });

  const words = props.text.split(" ");

  return (
    <motion.section ref={target} className={"h-[300%]"}>
      <div className={cn("sticky top-1/2 -translate-y-1/2", "flex justify-center")}>
        <div className={"w-lg rounded-lg border p-4"}>
          <p className={"flex gap-1"}>
            {words.map((word, index) => (
              <Word key={index} index={index} word={word} totalWords={words.length} progress={scrollYProgress} />
            ))}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
