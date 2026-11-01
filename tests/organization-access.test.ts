import { expect, test } from "bun:test";

import { resolveOrganizationAccess } from "#/lib/server/lib/organization-access";

test("only a member may select an organization", async () => {
  const isMember = async (userId: string, organizationId: string) => userId === "alice" && organizationId === "own";

  expect(await resolveOrganizationAccess("alice", "own", null, isMember)).toEqual({
    organizationId: "own",
    denied: false,
  });
  expect(await resolveOrganizationAccess("alice", undefined, "own", isMember)).toEqual({
    organizationId: "own",
    denied: false,
  });
  expect(await resolveOrganizationAccess("alice", "other", "own", isMember)).toEqual({
    organizationId: null,
    denied: true,
  });
  expect(await resolveOrganizationAccess(null, "own", null, isMember)).toEqual({ organizationId: null, denied: true });
  expect(await resolveOrganizationAccess("alice", undefined, "other", isMember)).toEqual({
    organizationId: null,
    denied: false,
  });
});
