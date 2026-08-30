"use client";

import { FilloutStandardEmbed } from "@fillout/react";

import { useSession } from "#/lib/providers/session";

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
