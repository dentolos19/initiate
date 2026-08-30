"use client";

import { BuildingIcon, MessageCircleIcon, UsersIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";

export default function Page() {
  return (
    <div className={"flex size-full items-center justify-center p-8"}>
      <Card className={"w-full max-w-md"}>
        <CardHeader className={"text-center"}>
          <div className={"bg-primary/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full"}>
            <MessageCircleIcon className={"text-primary size-8"} />
          </div>
          <CardTitle>Welcome to Messages</CardTitle>
          <CardDescription>Select a conversation from the sidebar to start messaging</CardDescription>
        </CardHeader>
        <CardContent className={"space-y-4"}>
          <div className={"grid gap-3"}>
            <div className={"flex items-center gap-3 rounded-lg border p-3"}>
              <div className={"flex size-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900"}>
                <UsersIcon className={"size-4 text-blue-600 dark:text-blue-400"} />
              </div>
              <div>
                <p className={"text-sm font-medium"}>Direct Messages</p>
                <p className={"text-muted-foreground text-xs"}>Chat directly with other users</p>
              </div>
            </div>

            <div className={"flex items-center gap-3 rounded-lg border p-3"}>
              <div className={"flex size-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"}>
                <BuildingIcon className={"size-4 text-green-600 dark:text-green-400"} />
              </div>
              <div>
                <p className={"text-sm font-medium"}>Organization Chats</p>
                <p className={"text-muted-foreground text-xs"}>Connect with organizations and teams</p>
              </div>
            </div>

            <div className={"flex items-center gap-3 rounded-lg border p-3"}>
              <div className={"flex size-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900"}>
                <UsersIcon className={"size-4 text-purple-600 dark:text-purple-400"} />
              </div>
              <div>
                <p className={"text-sm font-medium"}>Group Conversations</p>
                <p className={"text-muted-foreground text-xs"}>Collaborate with multiple participants</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
