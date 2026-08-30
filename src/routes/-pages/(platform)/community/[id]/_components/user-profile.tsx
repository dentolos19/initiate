"use client";

import { MessageSquareTextIcon, UserPlusIcon, UserXIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "#/components/ui/card";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { User } from "#/lib/backend/schema";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import { useRouter } from "#/lib/router";

export default function UserProfile(props: { data: User }) {
  const backend = useBackend();
  const router = useRouter();
  const session = useSession();

  const [user, setUser] = useState<User>();

  async function handleFollow() {
    if (!user) return;

    if (user.isFollowing) {
      await backend.user
        .unfollowUser(user.id)
        .then((user) => {
          setUser(user);
          toast.success("You are no longer following this user.");
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        });
    } else {
      await backend.user
        .followUser(user.id)
        .then((user) => {
          setUser(user);
          toast.success("You are now following this user.");
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        });
    }
  }

  async function handleContact() {
    if (!user) return;

    const room = await backend.messages.createUserRoom(user.id);
    router.push(`/messages/${room.id}`);
  }

  useEffect(() => {
    backend.user
      .getUser(props.data.id)
      .then((user) => {
        setUser(user);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }, [props.data]);

  if (!user) {
    return null;
  }

  return (
    <Card className={"gap-0"}>
      <CardHeader className={"mb-2"}>
        <div className={"flex items-center gap-2"}>
          <Avatar className={"size-10"}>
            <ImageWrapper src={user.imageUrl} avatar />
            <AvatarFallback>X</AvatarFallback>
          </Avatar>
          <div>
            <Link className={"font-bold hover:underline"} href={`/users/${user.id}`}>
              {user.firstName} {user.lastName}
            </Link>
            <p className={"text-muted-foreground text-xs"}>{user.followers} followers</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className={"text-muted-foreground text-sm"}>{user.tagline || "No tagline available."}</p>
      </CardContent>
      {session.user && session.user.id !== user.id && (
        <CardFooter className={"mt-4 gap-2 [&>*]:flex-1"}>
          <Button variant={"outline"} size={"sm"} onClick={handleFollow}>
            {user.isFollowing ? <UserXIcon /> : <UserPlusIcon />}
            <span>{user.isFollowing ? "Unfollow" : "Follow"}</span>
          </Button>
          <Button variant={"outline"} size={"sm"} onClick={handleContact}>
            <MessageSquareTextIcon />
            <span>Contact</span>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
