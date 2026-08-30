"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import { authClient } from "#/lib/auth/auth";
import useBackend from "#/lib/backend/client";
import { Organization, User } from "#/lib/backend/schema";

const SessionContext = createContext<{
  loading: boolean;
  user: User | null;
  organization: Organization | null;
  refreshUser: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
  showOrganizationProfile: () => Promise<void>;
  switchOrganization: (id: string) => void;
  signOut: () => Promise<void>;
}>({
  loading: true,
  user: null,
  organization: null,
  refreshUser: async () => {},
  refreshOrganization: async () => {},
  showOrganizationProfile: async () => {},
  switchOrganization: async (_id: string) => {},
  signOut: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export default function SessionProvider(props: { children?: ReactNode }) {
  const backend = useBackend();

  const { data: authSession, isPending: sessionPending } = authClient.useSession();
  const { data: activeOrganization, isPending: organizationPending } = authClient.useActiveOrganization();

  const activeOrganizationId = activeOrganization?.id;
  const userId = authSession?.user.id;

  const [loadedKey, setLoadedKey] = useState<string>();
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const sessionKey = `${userId ?? ""}:${activeOrganizationId ?? ""}`;
  const loading = sessionPending || organizationPending || loadedKey !== sessionKey;

  const loadUser = useCallback(async () => {
    if (!userId) return null;
    return backend.user.getUser();
  }, [backend.user, userId]);

  const loadOrganization = useCallback(async () => {
    if (!activeOrganizationId) return null;
    return backend.organization.getOrganization(activeOrganizationId);
  }, [activeOrganizationId, backend.organization]);

  const refreshUser = useCallback(async () => {
    setUser(await loadUser());
  }, [loadUser]);

  const refreshOrganization = useCallback(async () => {
    setOrganization(await loadOrganization());
  }, [loadOrganization]);

  async function showOrganizationProfile() {
    if (!activeOrganization) return;
    window.location.assign("/manage/organization");
  }

  function switchOrganization(id: string) {
    if (organization?.id === id) return;
    void authClient.organization.setActive({ organizationId: id });
  }

  async function signOut() {
    await authClient.signOut();
    window.location.assign("/");
  }

  useEffect(() => {
    if (sessionPending || organizationPending) return;
    let active = true;

    void Promise.allSettled([loadUser(), loadOrganization()]).then(([userResult, organizationResult]) => {
      if (!active) return;
      if (userResult.status === "rejected") {
        console.error("Failed to refresh the user session.", userResult.reason);
      }
      if (organizationResult.status === "rejected") {
        console.error("Failed to refresh the organization session.", organizationResult.reason);
      }

      setUser(userResult.status === "fulfilled" ? userResult.value : null);
      setOrganization(organizationResult.status === "fulfilled" ? organizationResult.value : null);
      setLoadedKey(sessionKey);
    });

    return () => {
      active = false;
    };
  }, [loadOrganization, loadUser, organizationPending, sessionKey, sessionPending]);

  return (
    <SessionContext.Provider
      value={{
        loading,
        user,
        organization,
        refreshUser,
        refreshOrganization,
        showOrganizationProfile,
        switchOrganization,
        signOut,
      }}
    >
      {props.children}
    </SessionContext.Provider>
  );
}
