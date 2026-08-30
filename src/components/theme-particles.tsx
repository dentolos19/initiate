import { ComponentProps } from "react";

import { Particles } from "#/components/ui/magic/particles";
import { useTheme } from "#/lib/providers/theme";

export default function ThemeParticles(props: ComponentProps<typeof Particles>) {
  const { resolvedTheme } = useTheme();
  return <Particles {...props} color={resolvedTheme === "dark" ? "#ffffff" : "#000000"} />;
}
