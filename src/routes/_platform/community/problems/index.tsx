import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import useBackend from "#/lib/backend/client";
import { CommunityPost } from "#/lib/backend/connectors/community";
import PostCard from "#/routes/_platform/community/-components/post-card";

export const Route = createFileRoute("/_platform/community/problems/")({ component: Page });

export default function Page() {
  const backend = useBackend();

  const [loading, setLoading] = useState<boolean>(true);
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    backend.community
      .problemPosts()
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
  }, []);

  return (
    <div className={"w-full p-4"}>
      <div className={"space-y-4"}>
        {/* Loading */}
        {loading && (
          <div className={"my-10"}>
            <LoadingSpinner />
          </div>
        )}

        {/* No Items */}
        {!loading && posts.length === 0 && (
          <div className={"text-muted-foreground my-10 text-center"}>No posts found.</div>
        )}

        {/* With Items */}
        {!loading && posts.length > 0 && posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
}
