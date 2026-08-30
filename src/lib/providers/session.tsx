"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { authClient } from "#/lib/auth/auth";
import useBackend from "#/lib/backend/client";
import { Organization, User } from "#/lib/backend/schema";

const SessionContext = createContext<{
  loading: boolean;
  user: User | null;
  organization: Organization | null;
  refreshUser: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
  showUserProfile: () => Promise<void>;
  showOrganizationProfile: () => Promise<void>;
  switchOrganization: (id: string) => void;
  signOut: () => Promise<void>;
}>({
  loading: true,
  user: null,
  organization: null,
  refreshUser: async () => {},
  refreshOrganization: async () => {},
  showUserProfile: async () => {},
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

  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);

  async function refreshUser() {
    if (authSession?.user) {
      await backend.user.getUser().then((user) => {
        setUser(user);
      });
    } else {
      setUser(null);
    }
  }

  async function refreshOrganization() {
    if (activeOrganization) {
      await backend.organization.getOrganization(activeOrganization.id).then((organization) => {
        setOrganization(organization);
      });
    } else {
      setOrganization(null);
    }
  }

  async function showUserProfile() {
    window.location.assign("/manage");
  }

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
    setLoading(true);
    void Promise.all([refreshUser(), refreshOrganization()])
      .catch((error: unknown) => {
        console.error("Failed to refresh the application session.", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authSession?.user.id, activeOrganization?.id, sessionPending, organizationPending]);

  return (
    <SessionContext.Provider
      value={{
        loading,
        user,
        organization,
        refreshUser,
        refreshOrganization,
        showUserProfile,
        showOrganizationProfile,
        switchOrganization,
        signOut,
      }}
    >
      {props.children}
    </SessionContext.Provider>
  );
}
