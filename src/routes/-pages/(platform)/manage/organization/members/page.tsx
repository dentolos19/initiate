"use client";

import { UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import ImageWrapper from "#/components/ui/wrappers/image";
import { authClient } from "#/lib/auth/auth";
import { useSession } from "#/lib/providers/session";
import Loading from "#/routes/-pages/loading";

type Member = {
  id: string;
  role: string;
  user: {
    email: string;
    id: string;
    image?: string | null;
    name: string;
  };
};

export default function Page() {
  const { organization } = useSession();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!organization) return;

    setLoading(true);
    void authClient.organization
      .listMembers({
        query: {
          limit: 100,
          organizationId: organization.id,
          sortBy: "createdAt",
          sortDirection: "asc",
        },
      })
      .then((result) => {
        if (result.error) throw new Error(result.error.message ?? "Could not load organization members.");
        setMembers((result.data?.members ?? []) as Member[]);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => setLoading(false));
  }, [organization]);

  if (loading) return <Loading />;

  return (
    <main className="container mx-auto max-w-4xl p-4">
      <Card>
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 grid size-11 place-items-center rounded-lg">
            <UsersIcon />
          </div>
          <CardTitle>Organization Members</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? "member" : "members"} in {organization?.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No members found.</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar>
                  <ImageWrapper src={member.user.image} alt={member.user.name} avatar />
                  <AvatarFallback>{member.user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{member.user.name}</p>
                  <p className="text-muted-foreground truncate text-sm">{member.user.email}</p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {member.role}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
