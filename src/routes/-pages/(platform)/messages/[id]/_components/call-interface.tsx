"use client";

import { useRealtimeKitClient } from "@cloudflare/realtimekit-react";
import { RtkMeeting } from "@cloudflare/realtimekit-react-ui";
import { LogOut, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import useBackend from "#/lib/backend/client";
import type { RealtimeKitRoom } from "#/lib/backend/connectors/realtimekit";

interface CallInterfaceProps {
  roomId: string;
  callType: "voice" | "video";
  realtimeKitRoom: RealtimeKitRoom;
  onCallEnd: () => void;
}

export function CallInterface({ callType, realtimeKitRoom, onCallEnd }: CallInterfaceProps) {
  const backend = useBackend();
  const [meeting, initMeeting] = useRealtimeKitClient();
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    void initMeeting({
      authToken: realtimeKitRoom.authToken,
      defaults: {
        audio: true,
        video: callType === "video",
      },
    });
  }, [callType, initMeeting, realtimeKitRoom.authToken]);

  async function leaveCall() {
    setIsEnding(true);
    try {
      await meeting?.leave();
      await backend.realtimekit.leaveRoom(realtimeKitRoom.meetingId);
      toast.success("Left call");
      onCallEnd();
    } catch (error) {
      console.error(error);
      toast.error("Could not leave the call cleanly");
    } finally {
      setIsEnding(false);
    }
  }

  if (!meeting) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="text-primary size-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background relative h-[calc(100dvh-4rem)] overflow-hidden">
      <RtkMeeting className="size-full" meeting={meeting} mode="fill" showSetupScreen />
      <Button
        className="absolute top-4 right-4 z-50 shadow-lg"
        variant="destructive"
        onClick={leaveCall}
        disabled={isEnding}
      >
        {isEnding ? <Loader2 className="animate-spin" /> : <LogOut />}
        Leave
      </Button>
    </div>
  );
}
