import { GoogleAnalytics } from "@next/third-parties/google";

import "./globals.css";

import type { Metadata } from "next";
import { Fira_Mono, Lora, Montserrat } from "next/font/google";
import { ReactNode } from "react";

import AppProvider from "#/components/app-provider";
import { ScrollArea, ScrollBar } from "#/components/ui/scroll-area";
import { Toaster } from "#/components/ui/sonner";
import { ENVIRONMENT } from "#/environment";
import { cn } from "#/lib/utils";

export const metadata: Metadata = {
  title: "Initiate",
  description: "The digital marketplace for AI solutions.",
};

const fontSans = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontSerif = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

const fontMono = Fira_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "400",
});

export default function Layout(props: { children: ReactNode }) {
  return (
    <html lang={"en"} suppressHydrationWarning={true}>
      <body className={cn(fontSans.variable, fontSerif.variable, fontMono.variable, "antialiased")}>
        {/* Main Application */}
        <AppProvider>
          <ScrollArea className={"h-screen w-screen [&_[data-radix-scroll-area-viewport]>div]:size-full"}>
            {props.children}
            <ScrollBar orientation={"vertical"} />
            <ScrollBar orientation={"horizontal"} />
          </ScrollArea>
          <Toaster />
        </AppProvider>

        {/* Google Analytics */}
        {ENVIRONMENT !== "development" && <GoogleAnalytics gaId={"G-GNDNV2JEGF"} />}
      </body>
    </html>
  );
}
