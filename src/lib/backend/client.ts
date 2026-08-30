import { authClient } from "#/lib/auth/auth";
import { generateMappings, generatePrimitives } from "#/lib/backend/primitives";

export default function useBackend() {
  const { data: session } = authClient.useSession();
  const { data: organization } = authClient.useActiveOrganization();
  const primitives = generatePrimitives({
    userId: session?.user.id,
    orgId: organization?.id ?? session?.session.activeOrganizationId,
  });
  const mappings = generateMappings(primitives);
  return mappings;
}
