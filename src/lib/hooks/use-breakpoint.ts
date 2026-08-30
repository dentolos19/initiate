import { useEffect, useState } from "react";

type BreakpointName = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const breakpointWidths = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

function getBreakpoint(width: number) {
  if (width >= breakpointWidths["2xl"]) {
    return "2xl";
  }
  if (width >= breakpointWidths.xl) {
    return "xl";
  }
  if (width >= breakpointWidths.lg) {
    return "lg";
  }
  if (width >= breakpointWidths.md) {
    return "md";
  }
  if (width >= breakpointWidths.sm) {
    return "sm";
  }
  return "xs";
}

export default function useBreakpoint(): BreakpointName {
  const [breakpoint, setBreakpoint] = useState<BreakpointName>(() => {
    if (typeof window !== "undefined") {
      return getBreakpoint(window.innerWidth);
    }
    return "xs";
  });

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return breakpoint;
}
