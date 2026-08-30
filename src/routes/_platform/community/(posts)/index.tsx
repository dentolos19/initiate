import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, LightbulbIcon, PlusIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Card, CardHeader } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { CommunityPost } from "#/lib/backend/connectors/community";
import { useStateUrl } from "#/lib/hooks";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import ProfileCard from "#/routes/_platform/community/(posts)/-components/profile-card";
import TopicsCard from "#/routes/_platform/community/(posts)/-components/topics-card";
import PostCard from "#/routes/_platform/community/-components/post-card";

export const Route = createFileRoute("/_platform/community/(posts)/")({ component: Page });

export default function Page() {
  const backend = useBackend();
  const { user } = useSession();

  const [loading, setLoading] = useState<boolean>(true);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isFollowingTopic, setIsFollowingTopic] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);

  const [sort] = useStateUrl("sort", "latest");
  const [topic] = useStateUrl("topic", "");

  // Function to check if user is following the current topic
  const checkFollowingStatus = async (topicName: string) => {
    if (!topicName) {
      setIsFollowingTopic(false);
      return;
    }

    try {
      const following = await backend.community.isFollowingTopic(topicName);
      setIsFollowingTopic(following);
    } catch (error) {
      console.error("Failed to check following status:", error);
    }
  };

  // Function to handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!topic) return;

    setFollowLoading(true);
    try {
      if (isFollowingTopic) {
        await backend.community.unfollowTopic(topic);
        setIsFollowingTopic(false);
        toast.success(`Unfollowed ${topic}`);
      } else {
        await backend.community.followTopic(topic);
        setIsFollowingTopic(true);
        toast.success(`Following ${topic}`);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    let promise: Promise<CommunityPost[]>;

    if (topic) {
      // Filter by topic takes precedence over sort
      promise = backend.community.getPostsByTopic(topic);
      // Check if user is following this topic
      checkFollowingStatus(topic);
    } else {
      if (sort === "trending") {
        promise = backend.community.popularPosts();
      } else if (sort === "following") {
        promise = backend.community.followedPosts();
      } else {
        promise = backend.community.latestPosts();
      }
      // Reset following status when no topic is selected
      setIsFollowingTopic(false);
    }

    setLoading(true);
    setPosts([]);

    promise
      .then((posts) => {
        setPosts(posts);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sort, topic]);

  return (
    <div className={"flex w-full gap-4 p-4"}>
      <div className={"flex-1 space-y-4"}>
        <Card className={"border-border/50"}>
          <CardHeader>
            <div className={"flex items-center gap-3"}>
              <Avatar className={"size-10"}>
                <ImageWrapper src={user?.imageUrl} avatar />
                <AvatarFallback>X</AvatarFallback>
              </Avatar>
              <Button
                className={
                  "text-muted-foreground hover:text-foreground h-12 w-full flex-1 justify-start transition-colors"
                }
                variant={"outline"}
                asChild
              >
                <Link href={"/community/manage/new"}>What's on your mind, {user?.firstName || "User"}?</Link>
              </Button>
            </div>
            <Separator className={"my-2"} />
            <div className={"flex items-center justify-between"}>
              <Button variant={"ghost"} size={"sm"} asChild>
                <Link href={"/community/manage/new?type=problem"}>
                  <LightbulbIcon />
                  <span>Raise Problem</span>
                </Link>
              </Button>
              <div className={"text-muted-foreground text-xs"}>Share your thoughts with the community</div>
            </div>
          </CardHeader>
        </Card>

        {/* Topic Filter Indicator */}
        {topic && (
          <Card className={"p-4"}>
            <div className={"flex items-center justify-between"}>
              <div className={"flex items-center gap-2"}>
                <span className={"text-sm font-medium"}>Filtered by topic:</span>
                <span className={"bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium"}>{topic}</span>
              </div>
              <div className={"flex items-center gap-2"}>
                <Button
                  variant={isFollowingTopic ? "default" : "outline"}
                  size={"sm"}
                  className={"h-8 px-3 text-xs"}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <LoadingSpinner className={"size-3"} />
                  ) : isFollowingTopic ? (
                    <>
                      <CheckIcon className={"mr-1 size-3"} />
                      Following
                    </>
                  ) : (
                    <>
                      <PlusIcon className={"mr-1 size-3"} />
                      Follow
                    </>
                  )}
                </Button>
                <Button variant={"ghost"} size={"sm"} className={"h-8 w-8 p-0"} asChild>
                  <Link href={"/community"}>
                    <X className={"size-4"} />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className={"my-10"}>
            <LoadingSpinner />
          </div>
        )}

        {/* Empty */}
        {!loading && posts.length === 0 && (
          <div className={"text-muted-foreground my-10 text-center"}>
            {topic ? `No posts found for topic "${topic}".` : "No posts found."}
          </div>
        )}

        {/* Posts */}
        {!loading && posts.length > 0 && posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>

      <div className={"w-80 space-y-4 max-xl:hidden"}>
        <ProfileCard />
        <TopicsCard />
      </div>
    </div>
  );
}
