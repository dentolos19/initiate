import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { PageDescription, PageHeader, PageHeading, PageShell, PageTitle } from "#/components/ui/page";
import ImageWrapper from "#/components/ui/wrappers/image";
import { authClient } from "#/lib/auth/auth";
import { useSession } from "#/lib/providers/session";
import Loading from "#/routes/-components/loading";

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

export const Route = createFileRoute("/_platform/manage/organization/members/")({ component: Page });

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
    <PageShell>
      <PageHeader>
        <PageHeading>
          <PageTitle>Organization Members</PageTitle>
          <PageDescription>
            {members.length} {members.length === 1 ? "member" : "members"} in {organization?.name}.
          </PageDescription>
        </PageHeading>
      </PageHeader>

      {members.length === 0 ? (
        <p className="text-muted-foreground border-b px-4 py-12 text-center sm:px-6">No members found.</p>
      ) : (
        <div className="divide-y border-b">
          {members.map((member) => (
            <div key={member.id} className="flex min-w-0 items-center gap-3 px-4 py-3 sm:px-6">
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
          ))}
        </div>
      )}
    </PageShell>
  );
}
