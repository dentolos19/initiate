"use client";

import { EditIcon, HeartIcon, ShareIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { RichViewer } from "#/components/ui/custom/rich";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { CommunityPost } from "#/lib/backend/connectors/community";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import { useParams } from "#/lib/router";
import { cn, formatDateTime } from "#/lib/utils";
import CommentSection from "#/routes/-pages/(platform)/community/[id]/_components/comment-section";
import ProposalSection from "#/routes/-pages/(platform)/community/[id]/_components/proposal-section";
import UserProfile from "#/routes/-pages/(platform)/community/[id]/_components/user-profile";

export default function Page() {
  const backend = useBackend();
  const params = useParams();
  const session = useSession();

  const id = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [post, setPost] = useState<CommunityPost>();

  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(post?.likes || 0);

  async function handleLike() {
    if (!post) return;

    if (isLiked) {
      await backend.community
        .unlikePost(post.id)
        .then(() => {
          setIsLiked(false);
          setLikeCount((prev) => Math.max(0, prev - 1));
          toast.success("You've unliked this post!");
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        });
    } else {
      await backend.community
        .likePost(post.id)
        .then(() => {
          setIsLiked(true);
          setLikeCount((prev) => prev + 1);
          toast.success("You've liked this post!");
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        });
    }
  }

  async function handleShare() {
    if (!post) return;

    const shareUrl = `${window.location.origin}/community/${post.id}`;
    const shareText = `${post.title} – Check out this post`;

    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: shareText,
          url: shareUrl,
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        });
    } else {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          toast.success("Link copied to clipboard!");
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        });
    }
  }

  useEffect(() => {
    backend.community
      .getPost(id)
      .then((post) => {
        setPost(post);
        setIsLiked(post.liked);
        setLikeCount(post.likes);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className={"my-20"}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!post) {
    return <div className={"my-20 text-center"}>Post not found.</div>;
  }

  return (
    <div className={"container mx-auto flex gap-4 p-4 max-lg:flex-col"}>
      {/* Content */}
      <div className={"max-w-4xl flex-1 space-y-4"}>
        {/* Post Content */}
        <Card>
          <CardHeader className={"border-b"}>
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
            <CardTitle className={"text-2xl"}>{post.title}</CardTitle>
            <CardDescription>{formatDateTime(post.createdAt)}</CardDescription>
          </CardHeader>
          <CardContent>
            <RichViewer content={post.content} />
          </CardContent>
        </Card>

        {/* Proposal Section */}
        {post.type === "problem" && <ProposalSection data={post} />}

        {/* Comment Section */}
        <CommentSection data={post} />
      </div>

      {/* Sidebar */}
      <div className={"space-y-4 lg:w-80"}>
        {/* Post Details */}
        <Card className={"gap-0 overflow-hidden p-0"}>
          <ImageWrapper className={"h-auto w-full"} src={post.imageUrl} alt={post.title} />
          <div className={"p-4"}>
            <h2 className={"mb-4 text-lg font-medium"}>{post.title}</h2>
            <div className={"grid grid-cols-2 gap-2"}>
              <Button variant={"outline"} size={"sm"} onClick={handleLike}>
                <HeartIcon className={cn(isLiked && "fill-red-400 text-red-400")} />
                <span>{likeCount} Likes</span>
              </Button>
              <Button variant={"outline"} size={"sm"} onClick={handleShare}>
                <ShareIcon />
                <span>Share</span>
              </Button>
              {post.user.id === session.user?.id && (
                <Button className={"col-span-2"} variant={"outline"} size={"sm"} asChild>
                  <Link href={`/community/manage/${post.id}`}>
                    <EditIcon />
                    <span>Edit</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* User Profile */}
        <UserProfile data={post.user} />

        {/* TODO: Organization Profile */}
      </div>
    </div>
  );
}
