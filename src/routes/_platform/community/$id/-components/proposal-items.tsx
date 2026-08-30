import { formatDistanceToNow } from "date-fns";
import {
  CheckIcon,
  ClockIcon,
  DollarSignIcon,
  EditIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { RichViewer } from "#/components/ui/custom/rich";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { CommunityProposal } from "#/lib/backend/connectors/community";
import { useSession } from "#/lib/providers/session";
import { useRouter } from "#/lib/router";
import { cn } from "#/lib/utils";

interface ProposalsListProps {
  problemId: string;
  onProposalUpdate?: () => void;
  isProblemOwner?: boolean;
}

export default function ProposalItems({ problemId, onProposalUpdate, isProblemOwner = false }: ProposalsListProps) {
  const backend = useBackend();
  const { user } = useSession();
  const router = useRouter();
  const [proposals, setProposals] = useState<CommunityProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProposals();
  }, [problemId]);

  function loadProposals() {
    setLoading(true);
    backend.community
      .getProposals(problemId)
      .then(setProposals)
      .catch((error: Error) => {
        console.error("Error loading proposals:", error);
        toast.error("Failed to load proposals");
      })
      .finally(() => setLoading(false));
  }

  function handleAcceptProposal(proposalId: string) {
    backend.community
      .acceptProposal(proposalId)
      .then(() => {
        toast.success("Proposal accepted! A draft order has been created for the service provider to customize.");
        loadProposals();
        onProposalUpdate?.();
      })
      .catch((error: Error) => {
        console.error("Error accepting proposal:", error);
        toast.error("Failed to accept proposal");
      });
  }

  function handleRejectProposal(proposalId: string) {
    backend.community
      .rejectProposal(proposalId)
      .then(() => {
        toast.success("Proposal rejected");
        loadProposals();
        onProposalUpdate?.();
      })
      .catch((error: Error) => {
        console.error("Error rejecting proposal:", error);
        toast.error("Failed to reject proposal");
      });
  }

  function handleDeleteProposal(proposalId: string) {
    if (!confirm("Are you sure you want to delete this proposal? This action cannot be undone.")) {
      return;
    }

    backend.community
      .deleteProposal(proposalId)
      .then(() => {
        toast.success("Proposal deleted successfully");
        loadProposals();
        onProposalUpdate?.();
      })
      .catch((error: Error) => {
        console.error("Error deleting proposal:", error);
        toast.error("Failed to delete proposal");
      });
  }

  function handleEditProposal(proposalId: string) {
    router.push(`/community/${problemId}/offer?edit=${proposalId}`);
  }

  function isProposalOwner(proposal: CommunityProposal): boolean {
    return user?.id === proposal.userId;
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "proposal":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  if (loading) {
    return (
      <div className={"flex items-center justify-center py-8"}>
        <div
          className={
            "h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          }
        />
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className={"flex flex-col items-center justify-center py-12"}>
          <FileTextIcon className={"text-muted-foreground mb-4 h-12 w-12"} />
          <h3 className={"mb-2 text-lg font-semibold"}>No Proposals Yet</h3>
          <p className={"text-muted-foreground text-center"}>
            When people offer solutions to your problem, their proposals will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={"space-y-4"}>
      <div className={"flex items-center justify-between"}>
        <h3 className={"text-lg font-semibold"}>Proposals ({proposals.length})</h3>
        <Button variant={"outline"} size={"sm"} onClick={loadProposals}>
          Refresh
        </Button>
      </div>

      {proposals.map((proposal) => (
        <Card key={proposal.id} className={"relative"}>
          <CardHeader>
            <div className={"flex items-start justify-between"}>
              <div className={"flex items-center gap-3"}>
                <Avatar className={"size-10"}>
                  <ImageWrapper
                    src={proposal.user.imageUrl}
                    alt={`${proposal.user.firstName} ${proposal.user.lastName}`}
                    avatar
                  />
                  <AvatarFallback>
                    {proposal.user.firstName[0]}
                    {proposal.user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className={"text-base"}>
                    {proposal.user.firstName} {proposal.user.lastName}
                  </CardTitle>
                  <CardDescription>
                    {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                  </CardDescription>
                </div>
              </div>
              <div className={"flex items-center gap-2"}>
                <Badge className={cn("text-xs", getStatusColor(proposal.status))}>
                  {proposal.status.toUpperCase()}
                </Badge>
                <div className={"flex items-center gap-1 text-sm font-medium"}>
                  <DollarSignIcon className={"h-4 w-4"} />${proposal.cost?.toFixed(2) || "0.00"}
                </div>

                {/* Dropdown menu for proposal actions */}
                {isProposalOwner(proposal) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant={"ghost"} size={"sm"} className={"h-8 w-8 p-0"}>
                        <MoreHorizontalIcon className={"h-4 w-4"} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={"end"}>
                      <DropdownMenuItem onClick={() => handleEditProposal(proposal.id)}>
                        <EditIcon className={"mr-2 h-4 w-4"} />
                        Edit Proposal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteProposal(proposal.id)} className={"text-red-600"}>
                        <TrashIcon className={"mr-2 h-4 w-4"} />
                        Delete Proposal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className={"space-y-4"}>
            {/* Proposal Title */}
            {proposal.title && (
              <div>
                <h4 className={"mb-2 font-medium"}>Proposal Title</h4>
                <p className={"text-muted-foreground text-sm"}>{proposal.title}</p>
              </div>
            )}

            {/* Proposal Description */}
            <div>
              <h4 className={"mb-2 font-medium"}>Description</h4>
              {/* <div className={"border rounded-lg p-3 bg-muted/20"}>
                <p className={"text-sm text-muted-foreground leading-relaxed"}>
                  {proposal.content}
                </p>
              </div> */}
              <RichViewer content={proposal.content} />
            </div>

            {/* Duration and Cost */}
            <div className={"grid grid-cols-2 gap-4"}>
              {proposal.duration && (
                <div>
                  <h4 className={"mb-2 flex items-center gap-1 font-medium"}>
                    <ClockIcon className={"h-4 w-4"} />
                    Duration
                  </h4>
                  <p className={"text-muted-foreground text-sm"}>{proposal.duration} days</p>
                </div>
              )}
              {proposal.cost && (
                <div>
                  <h4 className={"mb-2 flex items-center gap-1 font-medium"}>
                    <DollarSignIcon className={"h-4 w-4"} />
                    Total Cost
                  </h4>
                  <p className={"text-muted-foreground text-sm"}>${proposal.cost.toFixed(2)}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {isProblemOwner && proposal.status === "proposal" && (
              <div className={"flex gap-3 border-t pt-4"}>
                <Button
                  variant={"default"}
                  size={"sm"}
                  onClick={() => handleAcceptProposal(proposal.id)}
                  className={"flex-1"}
                >
                  <CheckIcon className={"mr-2 h-4 w-4"} />
                  Accept Proposal
                </Button>
                <Button
                  variant={"outline"}
                  size={"sm"}
                  onClick={() => handleRejectProposal(proposal.id)}
                  className={"flex-1"}
                >
                  <XIcon className={"mr-2 h-4 w-4"} />
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
