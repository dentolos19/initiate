import { useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import ImageWrapper from "#/components/ui/wrappers/image";
import { OrganizationParticipant, UserParticipant } from "#/lib/backend/connectors/messages";
import { useParams, useRouter, useSearchParams } from "#/lib/router";
import { cn } from "#/lib/utils";

export default function RoomItem(props: { data: UserParticipant | OrganizationParticipant }) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const room = props.data.room;
  const currentId = params.id as string;
  const currentAct = searchParams.get("act") || "user";

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [name, setName] = useState<string>("Unknown Room");
  const [description, setDescription] = useState<string>("No description available.");
  const [selected, setSelected] = useState<boolean>(false);

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());
    if ("userId" in props.data) {
      params.set("act", "user");
    } else {
      params.set("act", "organization");
    }
    router.replace(`/messages/${room.id}?${params.toString()}`);
  }

  useEffect(() => {
    if ("userId" in props.data) {
      const userParticipant = props.data as UserParticipant;
      const otherUser = userParticipant.room.users?.find(
        (participant) => participant.user.id !== userParticipant.userId,
      )?.user;

      if (otherUser) {
        setImageUrl(otherUser.imageUrl || null);
        setName(`${otherUser.firstName} ${otherUser.lastName}`.trim() || "Unknown User");
        setDescription("Direct Message");
      } else {
        const otherOrganization = userParticipant.room.organizations?.[0];

        if (otherOrganization) {
          setImageUrl(otherOrganization.organization.imageUrl || null);
          setName(otherOrganization.organization.name || "Unknown Organization");
          setDescription("Direct Message with Organization");
        } else {
          setImageUrl(null);
          setName("Unknown Room");
          setDescription("No participants found.");
        }
      }

      setSelected(currentAct !== "organization" && currentId === room.id);
    } else {
      const organizationParticipant = props.data as OrganizationParticipant;
      const otherUser = organizationParticipant.room.users?.[0]?.user;

      if (otherUser) {
        setImageUrl(otherUser.imageUrl || null);
        setName(`${otherUser.firstName} ${otherUser.lastName}`.trim() || "Unknown User");
        setDescription("Direct Message with User");
      } else {
        setImageUrl(null);
        setName("Unknown Room");
        setDescription("No participants found.");
      }

      setSelected(currentAct === "organization" && currentId === room.id);
    }
  }, [props.data, currentId, currentAct]);

  return (
    <button
      className={cn(
        "bg-sidebar hover:bg-muted flex items-center gap-3 border-b p-3 text-left transition",
        selected && "bg-muted",
      )}
      onClick={handleClick}
    >
      <Avatar className={"size-12"}>
        <ImageWrapper src={imageUrl} avatar />
        <AvatarFallback>X</AvatarFallback>
      </Avatar>
      <div className={"min-w-0 flex-1"}>
        <div className={"flex items-center justify-between"}>
          <h3 className={"truncate font-medium"}>{name}</h3>
          <span>{/* Timestamp */}</span>
        </div>
        <p className={"text-muted-foreground truncate text-sm"}>{description}</p>
      </div>
    </button>
  );
}
