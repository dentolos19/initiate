"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { MessageRoom } from "#/lib/backend/connectors/messages";
import { useAdvisor } from "#/lib/providers/advisor";
import { usePathname, useRouter, useSearchParams } from "#/lib/router";
import { cn } from "#/lib/utils";
import CallHistory from "#/routes/-pages/(platform)/messages/_components/call-history";
import OrganizationRooms from "#/routes/-pages/(platform)/messages/_components/organization-rooms";
import UserRooms from "#/routes/-pages/(platform)/messages/_components/user-rooms";
import { LayoutProps } from "#/types";

interface MessagesContextType {
  refreshRooms: () => void;
  updateRoomWithMessage: (roomId: string, message: any) => void;
}

const MessagesContext = createContext<MessagesContextType | null>(null);

export const useMessagesContext = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error("useMessagesContext must be used within MessagesContext");
  }
  return context;
};

export default function Layout(props: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showAdvisorButton, hideAdvisorButton } = useAdvisor();

  const context = searchParams.get("context") || "personal";
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function switchContext(context: "personal" | "organization" | "calls") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("context", context);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const refreshRooms = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const updateRoomWithMessage = (roomId: string, message: any) => {
    // Trigger a refresh when a new message is sent
    refreshRooms();
  };

  useEffect(() => {
    hideAdvisorButton();
    return () => {
      showAdvisorButton();
    };
  }, []);

  return (
    <MessagesContext.Provider value={{ refreshRooms, updateRoomWithMessage }}>
      <div className={"absolute inset-0 flex h-screen pt-16"}>
        <aside
          className={cn(
            "bg-sidebar w-80 border-r",
            "flex flex-col overflow-hidden",
            "max-md:hidden", // Hide on mobile, can be toggled later
          )}
        >
          <div className={"flex-1 overflow-hidden"}>
            <Tabs
              className={"h-full gap-0"}
              value={context}
              onValueChange={(value) => switchContext(value as "personal" | "organization" | "calls")}
            >
              <TabsList className={"grid w-full grid-cols-3 rounded-none border-b bg-transparent"}>
                <TabsTrigger value={"personal"} className="flex items-center gap-2">
                  Personal
                </TabsTrigger>
                <TabsTrigger value={"organization"} className="flex items-center gap-2">
                  Organization
                </TabsTrigger>
                <TabsTrigger value={"calls"} className="flex items-center gap-2">
                  Call History
                </TabsTrigger>
              </TabsList>
              <TabsContent value={"personal"} className={"mt-0 flex-1 overflow-y-auto"}>
                <UserRooms key={`user-${refreshTrigger}`} />
              </TabsContent>
              <TabsContent value={"organization"} className={"mt-0 flex-1 overflow-y-auto"}>
                <OrganizationRooms key={`org-${refreshTrigger}`} />
              </TabsContent>
              <TabsContent value={"calls"} className={"mt-0 flex-1 overflow-y-auto"}>
                <CallHistory />
              </TabsContent>
            </Tabs>
          </div>
        </aside>
        <main className={"bg-background flex flex-1 flex-col overflow-hidden"}>{props.children}</main>
      </div>
    </MessagesContext.Provider>
  );
}
