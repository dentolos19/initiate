"use client";

import { useEffect } from "react";

import { useAdvisor } from "#/lib/providers/advisor";
import { LayoutProps } from "#/types";

export default function Layout(props: LayoutProps) {
  const { showAdvisorButton, hideAdvisorButton } = useAdvisor();

  useEffect(() => {
    hideAdvisorButton();
    return () => {
      showAdvisorButton();
    };
  }, []);

  return props.children;
}
