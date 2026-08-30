import { createFileRoute } from "@tanstack/react-router";

import { AuthForm } from "#/components/auth-form";
import ThemeParticles from "#/components/theme-particles";

export const Route = createFileRoute("/_standalone/auth/")({ component: Page });

export default function Page() {
  return (
    <div className="relative grid min-h-full place-items-center overflow-hidden px-4 py-12">
      <ThemeParticles className={"absolute inset-0"} />
      <AuthForm mode="sign-in" />
    </div>
  );
}
