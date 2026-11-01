type RoomParticipants = {
  users: readonly { userId: string }[];
  organizations: readonly { organizationId: string }[];
};

export function isSameOrigin(origin: string | undefined, requestUrl: string) {
  return Boolean(origin) && origin === new URL(requestUrl).origin;
}

export async function canAccessRoom(
  room: RoomParticipants,
  userId: string,
  isMember: (userId: string, organizationId: string) => Promise<boolean>,
) {
  if (room.users.some((participant) => participant.userId === userId)) return true;

  for (const participant of room.organizations) {
    if (await isMember(userId, participant.organizationId)) return true;
  }
  return false;
}
