"use client";

import { useTheme } from "next-themes";
import { ComponentProps } from "react";

import { Particles } from "#/components/ui/magic/particles";

export default function ThemeParticles(props: ComponentProps<typeof Particles>) {
  const { resolvedTheme } = useTheme();
  return <Particles {...props} color={resolvedTheme === "dark" ? "#ffffff" : "#000000"} />;
}
