"use client";

import { formatDistanceToNow } from "date-fns";
import { HeartIcon, HeartPulseIcon, MessageCircleIcon, PencilRulerIcon, ShareIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "#/components/ui/card";
import { RichViewer } from "#/components/ui/custom/rich";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { CommunityPost } from "#/lib/backend/connectors/community";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import { useRouter } from "#/lib/router";
import { cn } from "#/lib/utils";

interface PostCardProps {
  post: CommunityPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onShare?: (postId: string) => void;
}

export default function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const backend = useBackend();
  const router = useRouter();
  const session = useSession();

  const contentRef = useRef<HTMLDivElement>(null);

  const [shouldShowMask, setShouldShowMask] = useState(false);
  const [liked, setLiked] = useState<boolean>(post.liked);
  const [likeCount, setLikeCount] = useState<number>(post.likes);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [showOfferModal, setShowOfferModal] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const maxheight = 256;

  function handleLike(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (liked) {
      backend.community
        .unlikePost(post.id)
        .then(() => {
          setLiked(false);
          setLikeCount((prev) => Math.max(0, prev - 1));
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error("Failed to unlike post.");
        });
    } else {
      backend.community
        .likePost(post.id)
        .then(() => {
          setLiked(true);
          setLikeCount((prev) => prev + 1);
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error("Failed to like post.");
        });
    }
  }

  function handleComment(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    router.push(`/community/${post.id}`);
  }

  function handleShare(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    navigator
      .share({
        title: post.title,
        text: `${post.title} – Check out this post`,
        url: `${window.location.origin}/community/${post.id}`,
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error("Failed to share post.");
      });
  }

  function handleManage(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (post.userId !== session?.user?.id) {
      toast.error("You can only manage your own posts.");
      return;
    }

    router.push(`/community/manage/${post.id}`);
  }

  function handleOffer(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (post.userId !== session?.user?.id) {
      toast.error("You cannot provide a solution to your own problem.");
      return;
    }

    router.push(`/community/${post.id}/offer`);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (contentRef.current) {
        const element = contentRef.current;
        const hasOverflow = element.scrollHeight > maxheight || element.scrollHeight > element.clientHeight;
        setShouldShowMask(hasOverflow);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [post.content]);

  useEffect(() => {
    setCommentCount(post.comments);
  }, [post.comments]);

  return (
    <Link className={"block"} href={`/community/${post.id}`} passHref>
      <Card className={"gap-2"}>
        <CardHeader>
          <div className={"flex justify-between"}>
            <div className={"flex items-center gap-1.5"}>
              <Avatar className={"size-4"}>
                <ImageWrapper src={post.user.imageUrl} avatar />
                <AvatarFallback>X</AvatarFallback>
              </Avatar>
              <span className={"text-muted-foreground text-xs"}>
                {post.user.firstName} {post.user.lastName}
              </span>
            </div>
            <div className={"text-muted-foreground text-xs"}>{timeAgo}</div>
          </div>
          <h1 className={"text-2xl font-medium"}>{post.title}</h1>
          {(post.type !== "general" || post.tags.length > 0) && (
            <div className={"flex gap-2"}>
              {post.type === "problem" && <Badge>Problem Statement</Badge>}
              {post.tags.map((tag) => (
                <Badge key={tag} variant={"outline"}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div
            ref={contentRef}
            className={cn(
              "relative max-h-64 overflow-hidden",
              shouldShowMask && "[mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)]",
            )}
          >
            <RichViewer content={post.content} />
          </div>
        </CardContent>
        <CardFooter className={"[&>*]:flex-1"}>
          <Button variant={"ghost"} size={"lg"} onClick={handleLike}>
            <HeartIcon className={cn(liked && "fill-red-400 text-red-400")} />
            <span className={"max-sm:hidden"}>{likeCount} Likes</span>
          </Button>
          <Button variant={"ghost"} size={"lg"} onClick={handleComment}>
            <MessageCircleIcon />
            <span className={"max-sm:hidden"}>{commentCount} Comments</span>
          </Button>
          <Button variant={"ghost"} size={"lg"} onClick={handleShare}>
            <ShareIcon />
            <span className={"max-sm:hidden"}>Share</span>
          </Button>
          {post.userId === session?.user?.id ? (
            <Button variant={"ghost"} size={"lg"} onClick={handleManage}>
              <PencilRulerIcon />
              <span className={"max-sm:hidden"}>Manage</span>
            </Button>
          ) : (
            <>
              {post.type === "problem" && (
                <Button variant={"ghost"} size={"lg"} onClick={handleOffer}>
                  <HeartPulseIcon />
                  <span className={"max-sm:hidden"}>Provide Solution</span>
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
