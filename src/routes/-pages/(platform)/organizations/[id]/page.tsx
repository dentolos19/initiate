"use client";

import { HeartCrackIcon, HeartIcon, MessageCircleIcon, NewspaperIcon, StoreIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import ImageWrapper from "#/components/ui/wrappers/image";
import VerifiedBadge from "#/components/verified-badge";
import useBackend from "#/lib/backend/client";
import { Organization } from "#/lib/backend/schema";
import { useParams, useRouter } from "#/lib/router";
import domains from "#/lib/store/domains";
import { getLabel } from "#/lib/utils";
import DescriptionSection from "#/routes/-pages/(platform)/organizations/[id]/_components/description-section";
import ReviewsSection from "#/routes/-pages/(platform)/organizations/[id]/_components/reviews-section";
import ServicesSection from "#/routes/-pages/(platform)/organizations/[id]/_components/services-section";
import Loading from "#/routes/-pages/loading";

export default function Page() {
  const backend = useBackend();
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [organization, setOrganization] = useState<Organization>();
  const [organizationLiked, setOrganizationLiked] = useState<boolean>(false);

  async function handleContact() {
    if (!organization) return;
    await backend.messages
      .createOrganizationRoom(organization.id)
      .then((room) => {
        router.push(`/messages/${room.id}`);
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  async function handleLike() {
    await backend.organization
      .likeOrganization(id)
      .then(() => {
        setOrganizationLiked(true);
        toast.success("You liked this organization.");
      })
      .catch((error: Error) => {
        toast.error(error.message);
      });
  }

  async function handleUnlike() {
    await backend.organization
      .unlikeOrganization(id)
      .then(() => {
        setOrganizationLiked(false);
        toast.success("You unliked this organization.");
      })
      .catch((error: Error) => {
        toast.error(error.message);
      });
  }

  useEffect(() => {
    backend.organization
      .getOrganization(id)
      .then((org) => {
        setOrganization(org);
        setOrganizationLiked(org.isLiked);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!organization) {
    return <div className={"my-20 text-center"}>Organization not found.</div>;
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
            src={organization?.imageUrl}
            alt={organization?.name}
          />

          {/* Left */}
          <div>
            <div className={"mb-4"}>
              {/* Title */}
              <div className={"mb-1 flex items-center gap-2"}>
                <h1 className={"mb-1 text-2xl font-bold"}>{organization?.name}</h1>
                {organization?.verified && <VerifiedBadge />}
              </div>

              {/* Tags */}
              <div className={"mb-2 flex gap-1"}>
                {organization?.tags.map((tag) => (
                  <Badge key={tag} variant={"outline"}>
                    {getLabel(domains, tag, "Unknown")}
                  </Badge>
                ))}
              </div>

              {/* Tagline */}
              <p className={"text-muted-foreground"}>{organization?.tagline ?? "No tagline available."}</p>
            </div>

            {/* Mini-Statistics */}
            <div className={"flex flex-1 items-end gap-4 text-sm"}>
              <div className={"flex items-center gap-1"}>
                <HeartIcon className={"size-4"} />
                <span>{organization?.likes} Likes</span>
              </div>
              <div className={"flex items-center gap-1"}>
                <NewspaperIcon className={"size-4"} />
                <span>0 Posts</span>
              </div>
              <div className={"flex items-center gap-1"}>
                <StoreIcon className={"size-4"} />
                <span>0 Sales</span>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className={"flex items-end gap-2"}>
            {organizationLiked ? (
              <Button variant={"destructive"} size={"sm"} onClick={handleUnlike}>
                <HeartCrackIcon />
                <span>Unlike</span>
              </Button>
            ) : (
              <Button variant={"default"} size={"sm"} onClick={handleLike}>
                <HeartIcon />
                <span>Like</span>
              </Button>
            )}

            <Button variant={"outline"} size={"sm"} onClick={handleContact}>
              <MessageCircleIcon />
              <span>Contact</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={"container mx-auto space-y-4 p-4"}>
        <DescriptionSection data={organization} />
        <ReviewsSection />
        <ServicesSection />
      </div>
    </div>
  );
}
