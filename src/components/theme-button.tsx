import { ComputerIcon, MoonIcon, SunIcon } from "lucide-react";
import { ComponentProps } from "react";

import { Button } from "#/components/ui/button";
import { useTheme } from "#/lib/providers/theme";

export default function ThemeButton(props: ComponentProps<typeof Button>) {
  const { theme, setTheme } = useTheme();

  const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  function toggleTheme() {
    setTheme(nextTheme);
  }

  return (
    <Button
      {...props}
      aria-label={`Use ${nextTheme} theme`}
      title={`Use ${nextTheme} theme`}
      variant={"outline"}
      size={"icon"}
      onClick={toggleTheme}
    >
      {(() => {
        switch (theme) {
          case "light":
            return <SunIcon aria-hidden="true" />;
          case "dark":
            return <MoonIcon aria-hidden="true" />;
          default:
            return <ComputerIcon aria-hidden="true" />;
        }
      })()}
    </Button>
  );
}
