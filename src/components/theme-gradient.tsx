import { ComponentProps } from "react";

import { MagicCard } from "#/components/ui/magic/magic-card";
import { useTheme } from "#/lib/providers/theme";

export default function ThemeGradient(props: ComponentProps<typeof MagicCard>) {
  const { resolvedTheme } = useTheme();
  return <MagicCard {...props} gradientColor={resolvedTheme === "dark" ? "#262626" : "#D9D9D955"} />;
}
