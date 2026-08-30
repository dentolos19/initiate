"use client";

import * as Sentry from "@sentry/tanstack-react-start";
import { useEffect } from "react";

import ThemeParticles from "#/components/theme-particles";
import { TypingAnimation } from "#/components/ui/magic/typing-animation";
import { ErrorRouteProps } from "#/types";

export default function Error(props: ErrorRouteProps) {
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
