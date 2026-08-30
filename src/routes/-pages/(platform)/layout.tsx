"use client";

import { ReactNode } from "react";

import AppShell from "#/components/app-shell";

export default function Layout(props: { children: ReactNode }) {
  return <AppShell>{props.children}</AppShell>;
}
