import { createFileRoute } from "@tanstack/react-router";
import { BuildingIcon, MessageCircleIcon, UsersIcon } from "lucide-react";

export const Route = createFileRoute("/_platform/messages/")({ component: Page });

export default function Page() {
  return (
    <div className={"flex size-full items-center"}>
      <section className="w-full border-y">
        <header className="px-4 py-8 text-center sm:px-6">
          <div className={"bg-primary/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-lg"}>
            <MessageCircleIcon className={"text-primary size-7"} aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-balance">Welcome to Messages</h1>
          <p className="text-muted-foreground mt-2 text-sm text-pretty">
            Select a conversation from the sidebar to start messaging.
          </p>
        </header>
        <div className="grid border-t md:grid-cols-3 md:divide-x">
          <section className="flex min-w-0 items-center gap-3 px-4 py-5 sm:px-6">
            <div className="bg-muted text-primary grid size-9 shrink-0 place-items-center rounded-md">
              <UsersIcon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-medium">Direct Messages</h2>
              <p className="text-muted-foreground mt-1 text-xs">Chat directly with other users.</p>
            </div>
          </section>
          <section className="flex min-w-0 items-center gap-3 border-t px-4 py-5 sm:px-6 md:border-t-0">
            <div className="bg-muted text-primary grid size-9 shrink-0 place-items-center rounded-md">
              <BuildingIcon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-medium">Organization Chats</h2>
              <p className="text-muted-foreground mt-1 text-xs">Connect with organizations and teams.</p>
            </div>
          </section>
          <section className="flex min-w-0 items-center gap-3 border-t px-4 py-5 sm:px-6 md:border-t-0">
            <div className="bg-muted text-primary grid size-9 shrink-0 place-items-center rounded-md">
              <UsersIcon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-medium">Group Conversations</h2>
              <p className="text-muted-foreground mt-1 text-xs">Collaborate with multiple participants.</p>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
