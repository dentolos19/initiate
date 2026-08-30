"use client";

import * as Sentry from "@sentry/tanstack-react-start";
import NextError from "next/error";
import { useEffect } from "react";

import { ErrorRouteProps } from "#/types";

export default function GlobalError(props: ErrorRouteProps) {
  useEffect(() => {
    console.error(props.error);
    Sentry.captureException(props.error);
  }, [props.error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
