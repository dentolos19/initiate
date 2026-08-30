import { ComponentProps, useEffect, useState } from "react";

import Image from "#/components/ui/wrappers/image";
import { useTheme } from "#/lib/providers/theme";

export default function LogoTitle(props: Omit<ComponentProps<typeof Image>, "src" | "alt">) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <Image
      {...props}
      src={mounted && resolvedTheme === "dark" ? "/assets/title-light.png" : "/assets/title-dark.png"}
      alt={"Initiate"}
    />
  );
}
