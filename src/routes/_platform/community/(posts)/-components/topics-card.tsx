import { CheckIcon, HashIcon, PlusIcon } from "lucide-react";
import { ComponentProps, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import useBackend from "#/lib/backend/client";
import { useSession } from "#/lib/providers/session";
import { useRouter } from "#/lib/router";
import { cn } from "#/lib/utils";

interface TopicItem {
  name: string;
  isFollowing: boolean;
  postCount?: number;
}

export default function TopicsCard(props: ComponentProps<typeof Card>) {
  const backend = useBackend();
  const router = useRouter();
  const { user } = useSession();

  const [loading, setLoading] = useState<boolean>(true);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [followedTopics, setFollowedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTopics();
  }, []);

  function loadTopics() {
    setLoading(true);

    Promise.all([backend.community.getTopTopics(), user ? backend.community.getFollowedTopics() : Promise.resolve([])])
      .then(([topTopics, followed]) => {
        const followedSet = new Set(followed);
        setFollowedTopics(followedSet);

        const topicItems: TopicItem[] = topTopics.map((topic) => ({
          name: topic,
          isFollowing: followedSet.has(topic),
        }));

        setTopics(topicItems);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error("Failed to load topics");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleFollowToggle(topicName: string) {
    if (!user) {
      router.push(`/auth?redirect=${encodeURIComponent(`/community?topic=${topicName}`)}`);
      return;
    }

    const isCurrentlyFollowing = followedTopics.has(topicName);

    const promise = isCurrentlyFollowing
      ? backend.community.unfollowTopic(topicName)
      : backend.community.followTopic(topicName);

    promise
      .then(() => {
        setTopics((prev) =>
          prev.map((topic) => (topic.name === topicName ? { ...topic, isFollowing: !isCurrentlyFollowing } : topic)),
        );

        setFollowedTopics((prev) => {
          const newSet = new Set(prev);
          if (isCurrentlyFollowing) {
            newSet.delete(topicName);
          } else {
            newSet.add(topicName);
          }
          return newSet;
        });

        toast.success(isCurrentlyFollowing ? `Unfollowed ${topicName}` : `Following ${topicName}`);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error("Failed to update follow status");
      });
  }

  function handleTopicClick(topicName: string) {
    router.push(`/community?topic=${encodeURIComponent(topicName)}`);
  }

  if (loading) {
    return (
      <Card {...props}>
        <CardHeader>
          <CardTitle className={"flex items-center gap-2"}>
            <HashIcon className={"h-5 w-5"} />
            Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={"space-y-4"}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={"flex items-center justify-between gap-3 py-2"}>
                <div className={"flex items-center gap-2"}>
                  <div className={"bg-muted h-6 w-6 animate-pulse rounded-full"}></div>
                  <div className={"bg-muted h-4 w-20 animate-pulse rounded"}></div>
                </div>
                <div className={"bg-muted h-6 w-14 animate-pulse rounded"}></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className={"flex items-center gap-2"}>
          <HashIcon className={"size-5"} />
          <span>Topics</span>
        </CardTitle>
        <CardDescription>Discover and join topics</CardDescription>
      </CardHeader>
      <CardContent className={"space-y-3"}>
        {topics.length === 0 ? (
          <div className={"text-muted-foreground py-4 text-center text-sm"}>No topics found</div>
        ) : (
          topics.map((topic) => (
            <div key={topic.name} className={"flex items-center justify-between gap-3 py-2"}>
              <Button
                variant={"ghost"}
                size={"sm"}
                className={"h-auto justify-start p-0 text-left hover:bg-transparent"}
                onClick={() => handleTopicClick(topic.name)}
              >
                <div className={"flex items-center gap-2"}>
                  <div
                    className={
                      "bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
                    }
                  >
                    #
                  </div>
                  <span className={"truncate text-sm font-medium"}>{topic.name}</span>
                </div>
              </Button>

              <Button
                variant={topic.isFollowing ? "default" : "outline"}
                size={"sm"}
                className={cn(
                  "h-6 shrink-0 px-2 text-xs",
                  topic.isFollowing && "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
                onClick={() => handleFollowToggle(topic.name)}
              >
                {topic.isFollowing ? (
                  <>
                    <CheckIcon className={"mr-1 h-3 w-3"} />
                    Following
                  </>
                ) : (
                  <>
                    <PlusIcon className={"mr-1 h-3 w-3"} />
                    Follow
                  </>
                )}
              </Button>
            </div>
          ))
        )}

        {topics.length > 0 && (
          <div className={"border-t pt-2"}>
            <Button
              variant={"ghost"}
              size={"sm"}
              className={"w-full justify-center text-xs"}
              onClick={() => toast.info("View all topics feature coming soon!")}
            >
              View All Topics
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
