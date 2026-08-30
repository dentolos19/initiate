import { PhoneIcon, VideoIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import useBackend from "#/lib/backend/client";
import type { RealtimeKitRoom } from "#/lib/backend/connectors/realtimekit";

interface CallButtonsProps {
  roomId: string;
  onCallStart: (callType: "voice" | "video", realtimeKitRoom: RealtimeKitRoom) => void;
  disabled?: boolean;
}

export function CallButtons({ roomId, onCallStart, disabled = false }: CallButtonsProps) {
  const backend = useBackend();
  const [isConnecting, setIsConnecting] = useState(false);

  function handleStartCall(callType: "voice" | "video") {
    setIsConnecting(true);

    const callPromise =
      callType === "voice" ? backend.realtimekit.startVoiceCall(roomId) : backend.realtimekit.startVideoCall(roomId);

    callPromise
      .then(function (realtimeKitRoom) {
        onCallStart(callType, realtimeKitRoom);
        toast.success(`${callType === "voice" ? "Voice" : "Video"} call started`);
      })
      .catch(function (error) {
        console.error("Failed to start call:", error);
        toast.error("Failed to start call");
      })
      .finally(function () {
        setIsConnecting(false);
      });
  }

  return (
    <div className={"flex gap-2"}>
      <Button
        aria-label="Start Voice Call"
        variant={"ghost"}
        size={"icon"}
        disabled={disabled || isConnecting}
        onClick={() => handleStartCall("voice")}
        title={"Start voice call"}
      >
        <PhoneIcon className={"h-4 w-4"} />
      </Button>
      <Button
        aria-label="Start Video Call"
        variant={"ghost"}
        size={"icon"}
        disabled={disabled || isConnecting}
        onClick={() => handleStartCall("video")}
        title={"Start video call"}
      >
        <VideoIcon className={"h-4 w-4"} />
      </Button>
    </div>
  );
}
