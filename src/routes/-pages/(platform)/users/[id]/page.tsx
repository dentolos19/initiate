"use client";

import {
  ClockIcon,
  DollarSignIcon,
  EditIcon,
  HeartIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  ThumbsUpIcon,
  UserPlusIcon,
  UserXIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { CommunityPost, CommunityProposal } from "#/lib/backend/connectors/community";
import { User } from "#/lib/backend/schema";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import { useParams, useRouter } from "#/lib/router";
import Loading from "#/routes/-pages/loading";

export default function Page() {
  const backend = useBackend();
  const session = useSession();
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User>();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [proposals, setProposals] = useState<CommunityProposal[]>([]);
  const [postsLoading, setPostsLoading] = useState<boolean>(false);
  const [proposalsLoading, setProposalsLoading] = useState<boolean>(false);

  async function handleFollow() {
    await backend.user
      .followUser(id)
      .then((user) => {
        setUser(user);
        toast.success("You are now following this user.");
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  async function handleUnfollow() {
    await backend.user
      .unfollowUser(id)
      .then((user) => {
        setUser(user);
        toast.success("You are no longer following this user.");
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  async function handleContact() {
    const room = await backend.messages.createUserRoom(id);
    router.push(`/messages/${room.id}`);
  }

  async function loadUserPosts() {
    setPostsLoading(true);
    try {
      const userPosts = await backend.user.getUserPosts(id, 1, 10);
      setPosts(userPosts);
    } catch (error) {
      console.error("Failed to load user posts:", error);
    } finally {
      setPostsLoading(false);
    }
  }

  async function loadUserProposals() {
    setProposalsLoading(true);
    try {
      const userProposals = await backend.user.getUserProposals(id, 1, 10);
      setProposals(userProposals);
    } catch (error) {
      console.error("Failed to load user proposals:", error);
    } finally {
      setProposalsLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    backend.user
      .getUser(id)
      .then((user) => {
        setUser(user);
        // Load posts and proposals after user is loaded
        loadUserPosts();
        loadUserProposals();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <div className={"my-20 text-center"}>User not found.</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className={"bg-secondary border-b"}>
        {/* Banner */}
        <ImageWrapper className={"h-50 w-full"} alt={"Banner"} />

        {/* Info */}
        <div className={"relative container mx-auto flex justify-between gap-4 border-t p-4 pt-12 max-sm:flex-col"}>
          {/* Avatar */}
          <ImageWrapper
            className={"absolute -top-30 size-40 rounded-lg border"}
            src={user.imageUrl}
            alt={`${user.firstName} ${user.lastName}`}
          />

          {/* Left */}
          <div>
            <div className={"mb-4"}>
              <h1 className={"mb-1 text-2xl font-bold"}>
                {user.firstName} {user.lastName}
              </h1>
              <p className={"text-muted-foreground"}>{user.tagline || "No tagline available."}</p>
            </div>
            <div className={"flex flex-1 items-end gap-4 text-sm"}>
              <div className={"flex items-center gap-1"}>
                <HeartIcon className={"size-4"} />
                <span>{user.followers} Followers</span>
              </div>
              <div className={"flex items-center gap-1"}>
                <UserPlusIcon className={"size-4"} />
                <span>{user.following} Following</span>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className={"flex items-end gap-2"}>
            {(() => {
              if (!session.user || session.user.id === user.id) {
                return null;
              }

              if (user.isFollowing) {
                return (
                  <Button variant={"destructive"} size={"sm"} onClick={handleUnfollow}>
                    <UserXIcon />
                    <span>Unfollow</span>
                  </Button>
                );
              } else {
                return (
                  <Button variant={"default"} size={"sm"} onClick={handleFollow}>
                    <UserPlusIcon />
                    <span>Follow</span>
                  </Button>
                );
              }
            })()}

            {session.user?.id === user.id ? (
              <Button variant={"outline"} size={"sm"} asChild>
                <Link href={"/manage"}>
                  <EditIcon />
                  <span>Edit</span>
                </Link>
              </Button>
            ) : (
              <Button variant={"outline"} size={"sm"} onClick={handleContact}>
                <MessageCircleIcon />
                <span>Contact</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={"container mx-auto p-4"}>
        <div className={"grid grid-cols-1 gap-4 lg:grid-cols-3"}>
          {/* Left */}
          <div className={"lg:col-span-1"}>
            <Card>
              <CardHeader>
                <CardTitle>About {user.firstName}</CardTitle>
              </CardHeader>
              <CardContent className={"space-y-4"}>
                {user.description ? (
                  <div>
                    <h3 className={"text-muted-foreground mb-2 text-sm font-medium"}>Description</h3>
                    <p className={"text-sm leading-relaxed"}>{user.description}</p>
                  </div>
                ) : (
                  <p className={"text-muted-foreground text-sm"}>No description available.</p>
                )}

                {user.location && (
                  <div>
                    <h3 className={"text-muted-foreground mb-2 text-sm font-medium"}>Location</h3>
                    <p className={"text-sm"}>{user.location}</p>
                  </div>
                )}

                <div>
                  <h3 className={"text-muted-foreground mb-2 text-sm font-medium"}>Stats</h3>
                  <div className={"flex gap-4 text-sm"}>
                    <div className={"flex items-center gap-1"}>
                      <HeartIcon className={"size-4"} />
                      <span>{user.followers} Followers</span>
                    </div>
                    <div className={"flex items-center gap-1"}>
                      <UserPlusIcon className={"size-4"} />
                      <span>{user.following} Following</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right */}
          <div className={"lg:col-span-2"}>
            <Tabs className={"gap-4"} defaultValue={"posts"}>
              <TabsList className={"w-full"}>
                <TabsTrigger value={"posts"}>Community Posts</TabsTrigger>
                <TabsTrigger value={"proposals"}>Proposals</TabsTrigger>
              </TabsList>
              <TabsContent value={"posts"}>
                {postsLoading ? (
                  <div className={"py-8 text-center"}>
                    <Loading />
                  </div>
                ) : posts.length > 0 ? (
                  <div className={"space-y-4"}>
                    {posts.map((post) => (
                      <Link key={post.id} className={"block"} href={`/community/${post.id}`}>
                        <Card className={"p-0"}>
                          <CardContent className={"p-4"}>
                            <div className={"mb-2 flex items-start justify-between"}>
                              <h3 className={"text-lg font-semibold"}>{post.title}</h3>
                              <span className={"text-muted-foreground text-xs"}>
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {post.excerpt && <p className={"text-muted-foreground mb-3 text-sm"}>{post.excerpt}</p>}

                            <div className={"text-muted-foreground flex items-center gap-4 text-sm"}>
                              <div className={"flex items-center gap-1"}>
                                <Badge>
                                  {post.type === "general" && "General Discussion"}
                                  {post.type === "problem" && "Problem Statement"}
                                </Badge>
                              </div>
                              <div className={"flex items-center gap-1"}>
                                <MessageSquareIcon className={"size-4"} />
                                <span>{post.comments} comments</span>
                              </div>
                              <div className={"flex items-center gap-1"}>
                                <ThumbsUpIcon className={"size-4"} />
                                <span>{post.likes} likes</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className={"text-muted-foreground py-8 text-center"}>No community posts found.</p>
                )}
              </TabsContent>
              <TabsContent value={"proposals"}>
                {proposalsLoading ? (
                  <div className={"py-8 text-center"}>
                    <Loading />
                  </div>
                ) : proposals.length > 0 ? (
                  <div className={"space-y-4"}>
                    {proposals.map((proposal) => (
                      <Card key={proposal.id} className={"p-0"}>
                        <CardContent className={"p-4"}>
                          <div className={"mb-2 flex items-start justify-between"}>
                            <h3 className={"text-lg font-semibold"}>{proposal.title}</h3>
                            <span className={"text-muted-foreground text-xs"}>
                              {new Date(proposal.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <p className={"text-muted-foreground mb-3 line-clamp-2 text-sm"}>{proposal.content}</p>

                          <div className={"text-muted-foreground flex items-center gap-4 text-sm"}>
                            {proposal.duration && (
                              <div className={"flex items-center gap-1"}>
                                <ClockIcon className={"size-4"} />
                                <span>{proposal.duration} days</span>
                              </div>
                            )}
                            {proposal.cost && (
                              <div className={"flex items-center gap-1"}>
                                <DollarSignIcon className={"size-4"} />
                                <span>${proposal.cost}</span>
                              </div>
                            )}
                            <div className={"flex items-center gap-1"}>
                              <span
                                className={`rounded-full px-2 py-1 text-xs ${
                                  proposal.status === "accepted"
                                    ? "bg-green-100 text-green-800"
                                    : proposal.status === "rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {proposal.status}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className={"text-muted-foreground py-8 text-center"}>No proposals found.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
