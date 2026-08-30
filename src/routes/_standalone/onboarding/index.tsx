import { createFileRoute, redirect } from "@tanstack/react-router";

import ThemeParticles from "#/components/theme-particles";
import { getSession } from "#/lib/auth/auth.functions";
import { getAuthDestination } from "#/lib/auth/redirect";
import { useSession } from "#/lib/providers/session";
import { useRouter, useSearchParams } from "#/lib/router";
import Loading from "#/routes/-components/loading";
import ProfileOnboarding from "#/routes/_standalone/onboarding/-components/profile-onboarding";

export const Route = createFileRoute("/_standalone/onboarding/")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();
    if (!session) throw redirect({ href: `/auth?redirect=${encodeURIComponent(location.href)}` });
  },
  component: Page,
});

export default function Page() {
  const session = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = getAuthDestination(searchParams.get("redirect"));

  if (session.loading) return <Loading />;

  if (!session.user) {
    return <div className="my-20 text-center">We couldn't load your account. Sign in again and retry.</div>;
  }

  return (
    <div className="grid size-full place-content-center p-4">
      <ThemeParticles className="absolute inset-0" />
      <div className="relative z-10">
        <ProfileOnboarding onNext={() => router.replace(destination)} />
      </div>
    </div>
  );
}
