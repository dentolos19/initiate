"use client";

import { ComputerIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { ComponentProps } from "react";

import { Button } from "#/components/ui/button";

export default function ThemeButton(props: ComponentProps<typeof Button>) {
  const { theme, setTheme } = useTheme();

  function toggleTheme() {
    switch (theme) {
      case "light":
        setTheme("dark");
        break;
      case "dark":
        setTheme("system");
        break;
      default:
        setTheme("light");
    }
  }

  return (
    <Button {...props} variant={"outline"} size={"icon"} onClick={toggleTheme}>
      {(() => {
        switch (theme) {
          case "light":
            return <SunIcon />;
          case "dark":
            return <MoonIcon />;
          default:
            return <ComputerIcon />;
        }
      })()}
    </Button>
  );
}
