"use client";

import { useState } from "react";

import ThemeParticles from "#/components/theme-particles";
import { useSession } from "#/lib/providers/session";
import { useRouter } from "#/lib/router";
import EndOnboarding from "#/routes/-pages/(standalone)/onboarding/_components/end-onboarding";
import ProfileOnboarding from "#/routes/-pages/(standalone)/onboarding/_components/profile-onboarding";

export default function Page() {
  const session = useSession();
  const router = useRouter();

  const [stage, setStage] = useState<"profile" | "end">("profile");

  function nextStage() {
    switch (stage) {
      case "profile":
        setStage("end");
        break;
      case "end":
        router.push("/");
        break;
    }
  }

  if (!session.user) {
    return <div className={"my-20 text-center"}>Please login.</div>;
  }

  return (
    <div className={"grid size-full place-content-center"}>
      <ThemeParticles className={"absolute inset-0"} />
      {stage === "profile" && <ProfileOnboarding user={session.user} onNext={nextStage} />}
      {stage === "end" && <EndOnboarding />}
    </div>
  );
}
