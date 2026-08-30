"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SendIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import LoadingSpinner from "#/components/loading-spinner";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { RichEditor } from "#/components/ui/custom/rich";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import FormWrapper from "#/components/ui/wrappers/form";
import useBackend from "#/lib/backend/client";
import { Organization } from "#/lib/backend/schema";
import { useParams, useRouter, useSearchParams } from "#/lib/router";
import { notifyLoading } from "#/lib/utils";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  duration: z.number().min(1, "Duration must be at least 1 day"),
  costs: z.number().min(0, "Costs must be non-negative"),
  organizationId: z.string().min(1, "Organization is required"),
});

export default function Page() {
  const backend = useBackend();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const form = useForm({ resolver: zodResolver(schema) });

  const postId = params.id as string;
  const proposalId = searchParams.get("edit");
  const mode = proposalId ? "update" : "create";

  const [loading, setLoading] = useState<boolean>(false);
  const [post, setPost] = useState<any>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const handleSubmit = form.handleSubmit(async (data) => {
    const proposalData = {
      title: data.title,
      content: data.description,
      duration: data.duration,
      cost: data.costs,
      organizationId: data.organizationId,
    };

    const message = mode === "update" ? "Updating proposal..." : "Submitting proposal...";
    const successMessage = mode === "update" ? "Proposal updated successfully!" : "Proposal submitted successfully!";

    await notifyLoading(
      message,
      (mode === "update"
        ? backend.community.updateProposal(proposalId!, proposalData)
        : backend.community.createProposal(postId, proposalData)
      ).then(() => {
        toast.success(successMessage);
        router.push(`/community/${postId}`);
      }),
    );
  });

  useEffect(() => {
    setLoading(true);
    form.reset({
      title: "",
      description: "",
      duration: 1,
      costs: 0,
      organizationId: "",
    });
    Promise.all([
      backend.community.getPost(postId).then((post) => {
        if (post.type !== "problem") {
          toast.error("This is not a problem statement");
          router.push(`/community/${postId}`);
          return;
        }
        setPost(post);
      }),
      backend.user.getUserOrganizations().then((orgs) => {
        setOrganizations(orgs);
      }),
      proposalId
        ? backend.community.getProposals(postId).then((proposals) => {
            const proposal = proposals.find((proposal) => proposal.id === proposalId);
            if (proposal) {
              form.reset({
                title: proposal.title,
                description: proposal.content,
                duration: proposal.duration ?? 1,
                costs: proposal.cost ?? 0,
                organizationId: proposal.organizationId ?? "",
              });
            }
          })
        : Promise.resolve(),
    ])
      .catch((error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [postId, proposalId]);

  if (loading) {
    return (
      <div className={"my-20"}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <FormWrapper className={"container mx-auto max-w-4xl p-4"} form={form} onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{mode === "update" ? "Edit Proposal" : "Create Proposal"}</CardTitle>
          <CardDescription>
            {mode === "update" ? "Edit your proposal" : "Submit your proposal"} for "{post?.title}"
          </CardDescription>
        </CardHeader>
        <CardContent className={"space-y-4"}>
          {/* Organization Selection */}
          <FormField
            control={form.control}
            name={"organizationId"}
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>Organization</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    disabled={formState.isSubmitting || organizations.length === 0}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          organizations.length === 0 ? "No organizations available" : "Select an organization..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((organization) => (
                        <SelectItem key={organization.id} value={organization.id}>
                          {organization.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  {organizations.length === 0
                    ? "You need to create or join an organization before submitting a proposal."
                    : "Select the organization that will fulfill this proposal"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Title */}
          <FormField
            control={form.control}
            name={"title"}
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>Proposal Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder={"Enter proposal title..."}
                    value={field.value}
                    disabled={formState.isSubmitting}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>Provide a clear and concise title for your proposal</FormDescription>
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name={"description"}
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <RichEditor value={field.value} onValueChange={field.onChange} />
                </FormControl>
                <FormDescription>Describe your approach, methodology, and solution in detail</FormDescription>
              </FormItem>
            )}
          />

          {/* Duration and Costs */}
          <div className={"grid grid-cols-2 gap-4"}>
            <FormField
              control={form.control}
              name={"duration"}
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Duration (Days)</FormLabel>
                  <FormControl>
                    <Input
                      type={"number"}
                      min={1}
                      value={field.value}
                      disabled={formState.isSubmitting}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>How many days will it take to complete?</FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={"costs"}
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Total Cost ($)</FormLabel>
                  <FormControl>
                    <Input
                      type={"number"}
                      min={0}
                      step={"0.01"}
                      value={field.value}
                      disabled={formState.isSubmitting}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Total cost for completing this proposal (in USD)</FormDescription>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type={"submit"} disabled={form.formState.isSubmitting || organizations.length === 0}>
            <SendIcon />
            <span>{mode === "update" ? "Update Proposal" : "Submit Proposal"}</span>
          </Button>
        </CardFooter>
      </Card>
    </FormWrapper>
  );
}
