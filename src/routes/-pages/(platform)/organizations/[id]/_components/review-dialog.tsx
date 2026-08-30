"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import Form from "#/components/ui/wrappers/form";
import useBackend from "#/lib/backend/client";
import { OrganizationReview } from "#/lib/backend/schema";
import { notifyLoading } from "#/lib/utils";

const schema = z.object({
  title: z.string(),
  message: z.string(),
  stars: z.number().min(1).max(5),
});

export default function ReviewDialog(props: {
  data: { organizationId: string; data?: OrganizationReview };
  open?: boolean;
  setOpen?: (open: boolean) => void;
  reloadCallback?: () => void;
}) {
  const backend = useBackend();
  const form = useForm({ resolver: zodResolver(schema) });

  function createSubmitHandler() {
    return form.handleSubmit((values) => {
      props.setOpen?.(false);

      const isEditing = !!props.data.data;
      const apiCall = isEditing
        ? backend.organization.updateOrganizationReview(props.data.organizationId, props.data.data!.id, values)
        : backend.organization.createOrganizationReview(props.data.organizationId, values);

      notifyLoading(
        isEditing ? "Updating review..." : "Creating review...",
        apiCall
          .then(() => {
            toast.success(isEditing ? "Review updated successfully." : "Review submitted successfully.");
            props.reloadCallback?.();
          })
          .catch((error: Error) => {
            console.error(error);
            toast.error(error.message);
          }),
      );
    });
  }
  useEffect(() => {
    if (!props.open) return;

    const reviewData = props.data.data;
    form.reset({
      title: reviewData?.title || "",
      message: reviewData?.message || "",
      stars: reviewData?.stars || 3,
    });
  }, [props.open, props.data.data]);

  return (
    <Form form={form} onSubmit={createSubmitHandler()}>
      <Dialog open={props.open} onOpenChange={props.setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{props.data.data ? "Edit Review" : "New Review"}</DialogTitle>
            <DialogDescription>
              {props.data.data
                ? "Update your review for this organization."
                : "Write a review for this organization. Your feedback helps others make informed decisions."}
            </DialogDescription>
          </DialogHeader>
          <div className={"space-y-4"}>
            {/* Title */}
            <FormField
              control={form.control}
              name={"title"}
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input value={field.value} disabled={formState.isSubmitting} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message */}
            <FormField
              control={form.control}
              name={"message"}
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea value={field.value} disabled={formState.isSubmitting} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Stars */}
            <FormField
              control={form.control}
              name={"stars"}
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Stars</FormLabel>
                  <FormControl>
                    <div className={"flex items-center justify-evenly gap-1"}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className={"cursor-pointer"}
                          type={"button"}
                          disabled={formState.isSubmitting}
                          onClick={() => field.onChange(star)}
                        >
                          <Star
                            className={`size-6 transition-colors ${
                              star <= field.value
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground hover:text-yellow-400"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <DialogFooter>
            <Button type={"submit"} variant={"default"} onClick={createSubmitHandler()}>
              {props.data.data ? "Update" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
