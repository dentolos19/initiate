import { useMemo } from "react";

import { authClient } from "#/lib/auth/auth";
import { generateMappings, generatePrimitives } from "#/lib/backend/primitives";

export default function useBackend() {
  const { data: session } = authClient.useSession();
  const { data: organization } = authClient.useActiveOrganization();
  const organizationId = organization?.id ?? session?.session.activeOrganizationId;
  const userId = session?.user.id;

  return useMemo(() => {
    const primitives = generatePrimitives({
      orgId: organizationId,
      userId,
    });
    return generateMappings(primitives);
  }, [organizationId, userId]);
}
