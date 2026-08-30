import { EditIcon, PencilRulerIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { Separator } from "#/components/ui/separator";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { ServiceReview } from "#/lib/backend/schema";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import { useParams } from "#/lib/router";
import { formatDateTime, notifyLoading } from "#/lib/utils";
import Loading from "#/routes/-components/loading";
import ReviewDialog from "#/routes/_platform/services/$id/-components/review-dialog";

export default function ReviewsSection() {
  const backend = useBackend();
  const params = useParams();
  const { user } = useSession();

  const id = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingReview, setEditingReview] = useState<ServiceReview | null>(null);

  function loadReviews() {
    setLoading(true);
    backend.service
      .getServiceReviews(id)
      .then((reviews) => {
        setReviews(reviews);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function deleteReview(reviewId: string) {
    notifyLoading(
      "Deleting review…",
      backend.service
        .deleteServiceReview(id, reviewId)
        .then(() => {
          toast.success("Review deleted successfully!");
          loadReviews();
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        }),
    );
  }

  function openEditDialog(review: ServiceReview) {
    setEditingReview(review);
    setDialogOpen(true);
  }

  function openNewDialog() {
    setEditingReview(null);
    setDialogOpen(true);
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditingReview(null);
    }
  }

  useEffect(loadReviews, [id]);

  if (loading) {
    return <Loading />;
  }

  return (
    <Card className={"gap-0 p-6"}>
      {/* Header */}
      <div className={"flex items-center justify-between"}>
        <div>
          <h2 className={"mb-1 flex items-center gap-2"}>
            <PencilRulerIcon className={"size-6"} />
            <span className={"text-2xl font-bold"}>Reviews</span>
          </h2>
          <p className={"text-muted-foreground text-sm"}>Verified reviews by people who had bought the service.</p>
        </div>
        <Button variant={"ghost"} onClick={openNewDialog}>
          <PlusIcon />
          <span>New Review</span>
        </Button>
      </div>

      <Separator className={"my-4"} />

      {/* Reviews */}
      <div className={"grid auto-rows-fr gap-2 sm:grid-cols-2"}>
        {/* Loading */}
        {loading && <Loading />}

        {/* No Reviews */}
        {!loading && reviews.length <= 0 && (
          <div className={"text-muted-foreground my-10 text-center sm:col-span-full"}>
            No reviews yet. Be the first to review this service!
          </div>
        )}

        {/* Items */}
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className={"flex flex-col gap-2"}>
              {/* Header */}
              <div className={"flex gap-2"}>
                <Avatar className={"size-12"}>
                  <ImageWrapper src={review.user.imageUrl} avatar />
                  <AvatarFallback>X</AvatarFallback>
                </Avatar>
                <div className={"flex-1"}>
                  <Link className={"font-medium hover:underline"} href={`/users/${review.userId}`}>
                    {review.user.firstName} {review.user.lastName}
                  </Link>
                  <div className={"text-muted-foreground mb-1 text-xs"}>
                    {Array.from({ length: review.stars }, (_, i) => (
                      <span key={i}>⭐</span>
                    ))}
                  </div>
                  <div className={"text-muted-foreground text-xs"}>{formatDateTime(review.createdAt)}</div>
                </div>
                {review.userId === user?.id && (
                  <div className={"flex gap-1"}>
                    <Button
                      aria-label="Edit Review"
                      variant={"ghost"}
                      size={"icon"}
                      onClick={() => openEditDialog(review)}
                    >
                      <EditIcon />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button aria-label="Delete Review" variant={"destructive"} size={"icon"}>
                          <TrashIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className={"w-60"}>
                        <div className={"font-medium"}>Are you sure?</div>
                        <div className={"text-muted-foreground mb-2 text-sm"}>This action is permanent!</div>
                        <Button variant={"destructive"} onClick={() => deleteReview(review.id)}>
                          Delete
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Title */}
              {review.title && <div className={"text-lg leading-tight font-semibold"}>{review.title}</div>}

              {/* Content */}
              <div className={"text-sm leading-relaxed"}>{review.message}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog */}
      <ReviewDialog
        data={{ serviceId: id, data: editingReview || undefined }}
        open={dialogOpen}
        setOpen={handleDialogClose}
        reloadCallback={loadReviews}
      />
    </Card>
  );
}
