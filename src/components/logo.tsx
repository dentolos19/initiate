import { ComponentProps } from "react";

import Image from "#/components/ui/wrappers/image";
import { useTheme } from "#/lib/providers/theme";

export default function Logo(props: Omit<ComponentProps<typeof Image>, "src" | "alt">) {
  const { resolvedTheme } = useTheme();
  return (
    <Image
      {...props}
      src={resolvedTheme === "dark" ? "/assets/logo-light.png" : "/assets/logo-dark.png"}
      alt={"Initiate"}
    />
  );
}
