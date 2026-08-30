"use client";

import { FileTextIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { CommunityPost } from "#/lib/backend/connectors/community";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import ProposalItems from "#/routes/-pages/(platform)/community/[id]/_components/proposal-items";

export default function ProposalSection(props: { data: CommunityPost }) {
  const { data: post } = props;

  const { user } = useSession();

  const [refreshKey, setRefreshKey] = useState(0);

  const isProblemOwner = user?.id === post.user.id;

  const handleProposalUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileTextIcon className="text-primary h-5 w-5" />
              <CardTitle className="text-lg">Proposals</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              Problem Statement
            </Badge>
          </div>

          {!isProblemOwner && (
            <Button size="sm" className="gap-2" asChild>
              <Link href={`/community/${post.id}/offer`}>
                <PlusIcon className="h-4 w-4" />
                Submit Proposal
              </Link>
            </Button>
          )}
        </div>

        <CardDescription>
          {isProblemOwner
            ? "Review and manage proposals submitted for your problem statement."
            : "Submit a proposal to provide a solution for this problem statement."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Always show proposals */}
          <ProposalItems
            key={refreshKey}
            problemId={post.id}
            onProposalUpdate={handleProposalUpdate}
            isProblemOwner={isProblemOwner}
          />
        </div>
      </CardContent>
    </Card>
  );
}
