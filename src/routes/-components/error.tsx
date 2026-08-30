import * as Sentry from "@sentry/react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";

import ThemeParticles from "#/components/theme-particles";
import { TypingAnimation } from "#/components/ui/magic/typing-animation";
export default function Error(props: ErrorComponentProps) {
  useEffect(() => {
    console.error(props.error);
    Sentry.captureException(props.error);
  }, [props.error]);

  return (
    <div className={"grid size-full place-content-center"}>
      <ThemeParticles className={"absolute inset-0"} />
      <TypingAnimation className={"m-4 text-center font-mono"}>Something went wrong!</TypingAnimation>
    </div>
  );
}
