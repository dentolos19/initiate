import { FilloutStandardEmbed } from "@fillout/react";
import { createFileRoute } from "@tanstack/react-router";

import { useSession } from "#/lib/providers/session";

export const Route = createFileRoute("/_standalone/feedback/")({ component: Page });

export default function Page() {
  const session = useSession();

  return (
    <FilloutStandardEmbed
      filloutId={"57ZDENpZYLus"}
      parameters={{
        name: `${session.user?.firstName} ${session.user?.lastName}`.trim(),
        email: session.user?.emails[0],
      }}
    />
  );
}
