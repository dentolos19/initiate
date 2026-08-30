import { HeartIcon, MapPinIcon, PlusIcon, RssIcon, SettingsIcon, UserPlusIcon, UsersIcon } from "lucide-react";
import { ComponentProps, useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import useBackend from "#/lib/backend/client";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import userTypes from "#/lib/store/user-types";
import { getLabel } from "#/lib/utils";

interface UserStats {
  followers: number;
  following: number;
  posts: number;
  orders: {
    totalOrders: number;
    completedOrders: number;
  };
  invoices: {
    totalInvoices: number;
    paidInvoices: number;
    totalAmount: number;
    paidAmount: number;
  };
}

export default function ProfileCard(props: ComponentProps<typeof Card>) {
  const { user } = useSession();
  const backend = useBackend();

  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadUserStats();
  }, [user]);

  function loadUserStats() {
    setLoading(true);

    Promise.all([
      backend.user.getUserOrderStatistics("current"),
      backend.user.getUserInvoiceStatistics("current"),
      // Get a reasonable sample of recent posts to estimate user's post count
      backend.community.latestPosts(1, 50).then((posts) => posts.filter((post) => post.user.id === user?.id).length),
    ])
      .then(([orderStats, invoiceStats, recentPostsCount]) => {
        setStats({
          followers: user?.followers || 0,
          following: user?.following || 0,
          posts: recentPostsCount, // This shows recent posts, not total posts
          orders: orderStats,
          invoices: invoiceStats,
        });
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error("Failed to load profile statistics");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  if (!user) {
    return (
      <Card {...props}>
        <CardHeader>
          <CardTitle className={"flex items-center gap-2"}>
            <UsersIcon className={"size-5"} />
            <span>Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={"text-muted-foreground py-4 text-center text-sm"}>Please log in to view your profile</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className={"flex items-center gap-2"}>
          <UsersIcon className={"size-5"} />
          <span>Profile</span>
        </CardTitle>
        <CardDescription>Your profile overview</CardDescription>
      </CardHeader>
      <CardContent className={"space-y-4"}>
        {/* Profile Info */}
        <div className={"flex items-center gap-3"}>
          <Avatar className={"h-12 w-12"}>
            <AvatarImage src={user.imageUrl || undefined} />
            <AvatarFallback>
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className={"min-w-0 flex-1"}>
            <div className={"truncate font-medium"}>
              {user.firstName} {user.lastName}
            </div>
            {user.tagline && <div className={"text-muted-foreground text-xs"}>{getLabel(userTypes, user?.type)}</div>}
          </div>
        </div>

        {/* Location */}
        {user.location && (
          <div className={"flex items-center gap-2 text-sm"}>
            <MapPinIcon className={"text-muted-foreground h-4 w-4"} />
            <span className={"text-muted-foreground"}>{user.location}</span>
          </div>
        )}

        <Separator />

        {/* Statistics */}
        {loading ? (
          <div className={"py-4"}>
            <LoadingSpinner size={"sm"} />
          </div>
        ) : stats ? (
          <div className={"space-y-2"}>
            <div className={"flex items-center justify-between text-sm"}>
              <div className={"text-muted-foreground flex items-center gap-2"}>
                <HeartIcon className={"size-4"} />
                <span>Followers</span>
              </div>
              <Badge variant={"secondary"} className={"text-xs"}>
                {stats.followers}
              </Badge>
            </div>

            <div className={"flex items-center justify-between text-sm"}>
              <div className={"text-muted-foreground flex items-center gap-2"}>
                <UsersIcon className={"size-4"} />
                <span>Following</span>
              </div>
              <Badge variant={"secondary"} className={"text-xs"}>
                {stats.following}
              </Badge>
            </div>

            <div className={"flex items-center justify-between text-sm"}>
              <div className={"text-muted-foreground flex items-center gap-2"}>
                <RssIcon className={"size-4"} />
                <span>Recent Posts</span>
              </div>
              <Badge variant={"secondary"} className={"text-xs"}>
                {stats.posts}
              </Badge>
            </div>
          </div>
        ) : (
          <div className={"text-muted-foreground py-4 text-center text-sm"}>Failed to load statistics</div>
        )}

        <Separator />

        {/* Quick Actions */}
        <div className={"flex flex-col gap-2"}>
          <Button variant={"outline"} size={"sm"} asChild>
            <Link href={"/community/manage/new"}>
              <PlusIcon />
              <span>New Post</span>
            </Link>
          </Button>
          <Button variant={"outline"} size={"sm"} asChild>
            <Link href={`/users/${user.id}`}>
              <UserPlusIcon />
              <span>View Profile</span>
            </Link>
          </Button>
          <Button variant={"outline"} size={"sm"} asChild>
            <Link href={"/manage"}>
              <SettingsIcon />
              <span>Edit Profile</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
