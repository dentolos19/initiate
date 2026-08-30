"use client";

import { ReactNode } from "react";

import { TooltipProvider } from "#/components/ui/tooltip";
import AdvisorProvider from "#/lib/providers/advisor";
import AuthProvider from "#/lib/providers/auth";
import { PromptProvider } from "#/lib/providers/prompt";
import SessionProvider from "#/lib/providers/session";
import ThemeProvider from "#/lib/providers/theme";
import TourProvider from "#/lib/providers/tour";

export default function AppProvider(props: { children?: ReactNode }) {
  return (
    <ThemeProvider attribute={"class"} defaultTheme={"system"} enableSystem>
      <AuthProvider>
        <SessionProvider>
          <TooltipProvider>
            <PromptProvider>
              <AdvisorProvider>
                <TourProvider>{props.children}</TourProvider>
              </AdvisorProvider>
            </PromptProvider>
          </TooltipProvider>
        </SessionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
