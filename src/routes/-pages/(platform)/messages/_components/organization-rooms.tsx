"use client";

import { useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import useBackend from "#/lib/backend/client";
import { MessageRoom } from "#/lib/backend/connectors/messages";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import { useParams } from "#/lib/router";
import { cn } from "#/lib/utils";

export default function OrganizationRooms() {
  const backend = useBackend();
  const session = useSession();
  const params = useParams();
  const [rooms, setRooms] = useState<MessageRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const id = params.id;

  useEffect(() => {
    backend.messages
      .getOrganizationRooms()
      .then((fetchedRooms) => {
        // Remove duplicates and sort by latest message
        const uniqueRooms = fetchedRooms.filter(
          (room, index, self) => index === self.findIndex((r) => r.id === room.id),
        );

        // Sort rooms by latest message timestamp
        const sortedRooms = uniqueRooms.sort((a, b) => {
          const aLatest = a.messages?.[0]?.createdAt || "1970-01-01T00:00:00Z";
          const bLatest = b.messages?.[0]?.createdAt || "1970-01-01T00:00:00Z";
          return new Date(bLatest).getTime() - new Date(aLatest).getTime();
        });

        console.log("Fetched org rooms:", fetchedRooms.length, "Unique org rooms:", uniqueRooms.length);
        setRooms(sortedRooms);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {rooms.map((room) => {
          const otherUser = room.users?.[0]?.user;
          const displayName = otherUser
            ? `${otherUser.firstName} ${otherUser.lastName}`.trim() || "Unknown User"
            : "Unknown User";

          // Get latest message from either sender
          const latestMessage = room.messages?.[0]; // Backend already sorts by createdAt desc
          const messagePreview = latestMessage?.content
            ? latestMessage.content.length > 50
              ? `${latestMessage.content.substring(0, 50)}...`
              : latestMessage.content
            : latestMessage?.attachments?.length
              ? `📎 ${latestMessage.attachments.length} attachment${latestMessage.attachments.length > 1 ? "s" : ""}`
              : "No messages yet";

          return (
            <Link
              key={`org-room-${room.id}`}
              href={`/messages/${room.id}?act=organization&context=organization`}
              className={cn("hover:bg-muted/50 flex items-center gap-3 border-b p-4", room.id === id && "bg-muted")}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{displayName}</div>
                <div className="text-muted-foreground truncate text-sm">{messagePreview}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
