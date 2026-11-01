export async function resolveOrganizationAccess(
  userId: string | null,
  requestedId: string | undefined,
  activeId: string | null,
  isMember: (userId: string, organizationId: string) => Promise<boolean>,
) {
  const organizationId = requestedId ?? activeId;
  if (!organizationId) return { organizationId: null, denied: false };
  if (userId && (await isMember(userId, organizationId))) return { organizationId, denied: false };
  return { organizationId: null, denied: requestedId !== undefined };
}
