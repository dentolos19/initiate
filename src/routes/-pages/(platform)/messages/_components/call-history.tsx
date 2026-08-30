"use client";

import { PhoneCallIcon, VideoIcon, ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import useBackend from "#/lib/backend/client";
import { RealtimeKitCallHistory } from "#/lib/backend/connectors/realtimekit";
import { useSession } from "#/lib/providers/session";
import { cn } from "#/lib/utils";

export default function CallHistory() {
  const backend = useBackend();
  const session = useSession();
  const [callHistory, setCallHistory] = useState<RealtimeKitCallHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageRooms, setMessageRooms] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    backend.realtimekit
      .getCallHistory()
      .then(async (history) => {
        setCallHistory(history);

        // Extract the application room IDs stored alongside RealtimeKit meeting IDs.
        const messageRoomIds = new Set(
          history.calls.map((call) => call.messageRoomId).filter((roomId): roomId is string => Boolean(roomId)),
        );

        // Fetch message room data for each unique room ID
        const roomDataMap = new Map();
        const roomPromises = Array.from(messageRoomIds).map(async (roomId) => {
          try {
            const room = await backend.messages.getRoom(roomId);
            roomDataMap.set(roomId, room);
          } catch (error) {
            console.error(`Failed to fetch room ${roomId}:`, error);
          }
        });

        await Promise.all(roomPromises);
        setMessageRooms(roomDataMap);
      })
      .catch((error) => {
        console.error("Failed to load call history:", error);
        toast.error("Failed to load call history");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function formatCallTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "long" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }

  function getOtherParticipants(call: RealtimeKitCallHistory["calls"][0]) {
    return call.participants.filter((p) => p.userId !== session.user?.id).map((p) => p.user);
  }

  function getMainParticipant(call: RealtimeKitCallHistory["calls"][0]) {
    const messageRoomId = call.messageRoomId;
    if (!messageRoomId) return getOtherParticipants(call)[0] ?? call.initiator;
    const messageRoom = messageRooms.get(messageRoomId);

    if (messageRoom) {
      // Find the other participant in the message room (not the current user)
      const otherUser = messageRoom.users?.find((userRoom: any) => userRoom.user.id !== session.user?.id)?.user;

      const otherOrganization = messageRoom.organizations?.find(
        (orgRoom: any) => orgRoom.organization.id !== session.organization?.id,
      )?.organization;

      if (otherUser) {
        return {
          firstName: otherUser.firstName,
          lastName: otherUser.lastName || "",
          imageUrl: otherUser.imageUrl,
        };
      } else if (otherOrganization) {
        return {
          firstName: otherOrganization.name,
          lastName: "",
          imageUrl: null,
        };
      }
    }

    // Fallback to the original logic if message room data is not available
    const isInitiator = call.initiatorId === session.user?.id;

    if (isInitiator) {
      // If I initiated the call, show the first other participant
      const otherParticipants = getOtherParticipants(call);
      return otherParticipants[0] || call.initiator; // Fallback to initiator if no others
    } else {
      // If someone else initiated, show the initiator
      return call.initiator;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!callHistory || callHistory.calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <ClockIcon className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold">No call history</h3>
        <p className="text-muted-foreground text-sm">Your voice and video call history will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-3">
      <div className="mb-2 px-1 py-2">
        <h2 className="text-sm font-semibold">Call History</h2>
      </div>

      <div className="space-y-1">
        {callHistory.calls.map((call) => {
          const isInitiator = call.initiatorId === session.user?.id;
          const mainParticipant = getMainParticipant(call);
          const isMissed = call.type === "MISSED";

          return (
            <div
              key={call.id}
              className="hover:bg-muted/50 flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors"
            >
              {/* Call Type Icon */}
              <div
                className={cn(
                  "p-2 rounded-full",
                  isMissed ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30",
                )}
              >
                {call.callType === "VIDEO" ? (
                  <VideoIcon
                    className={cn(
                      "h-4 w-4",
                      isMissed ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400",
                    )}
                  />
                ) : (
                  <PhoneCallIcon
                    className={cn(
                      "h-4 w-4",
                      isMissed ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400",
                    )}
                  />
                )}
              </div>

              {/* Call Info */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {mainParticipant.firstName} {mainParticipant.lastName || ""}
                </div>
                <div className="flex items-center space-x-1">
                  <span className={cn("text-xs", isMissed ? "text-red-500" : "text-muted-foreground")}>
                    {isMissed
                      ? isInitiator
                        ? "Outgoing missed"
                        : "Incoming missed"
                      : isInitiator
                        ? "Outgoing"
                        : "Incoming"}
                  </span>
                </div>
              </div>

              {/* Time */}
              <div className="text-right">
                <div className="text-muted-foreground text-xs">{formatCallTime(call.startedAt)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
