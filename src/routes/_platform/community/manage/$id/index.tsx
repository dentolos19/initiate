import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { LightbulbIcon, SaveIcon, SparklesIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import LoadingSpinner from "#/components/loading-spinner";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { RichEditor } from "#/components/ui/custom/rich";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import {
  Tags,
  TagsContent,
  TagsEmpty,
  TagsGroup,
  TagsInput,
  TagsItem,
  TagsList,
  TagsTrigger,
  TagsValue,
} from "#/components/ui/kibo/tags";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import FormWrapper from "#/components/ui/wrappers/form";
import useBackend from "#/lib/backend/client";
import { useAdvisor } from "#/lib/providers/advisor";
import { useSession } from "#/lib/providers/session";
import { useParams, useRouter } from "#/lib/router";
import topicsValues from "#/lib/store/topics";
import { notifyLoading } from "#/lib/utils";

const schema = z.object({
  title: z.string(),
  type: z.string().default("general"),
  tags: z.string().array(),
  content: z.string(),

  // Problems
  budget: z.number().optional(),
  dueAt: z.string().datetime().optional(),
});

export const Route = createFileRoute("/_platform/community/manage/$id/")({ component: Page });

export default function Page() {
  const backend = useBackend();
  const router = useRouter();
  const params = useParams();
  const form = useForm({ resolver: zodResolver(schema) });
  const { user } = useSession();
  const advisor = useAdvisor();

  const id = params.id as string;
  const mode = id === "new" ? "create" : "update";
  const type = form.watch("type");

  const [loading, setLoading] = useState<boolean>(false);
  const [tag, setTag] = useState<string>("");
  const [post, setPost] = useState<any>(null);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (mode === "create") {
      await notifyLoading(
        "Submitting post…",
        backend.community.createPost(data).then((post) => {
          toast.success("Post submitted!");
          router.push(`/community/${post.id}`);
        }),
      );
    } else {
      await notifyLoading(
        "Updating post…",
        backend.community.updatePost(id, data).then((post) => {
          toast.success("Post updated!");
          router.push(`/community/${post.id}`);
        }),
      );
    }
  });

  const handleDelete = async () => {
    if (mode !== "update") return;

    await notifyLoading(
      "Deleting post…",
      backend.community.deletePost(id).then(() => {
        toast.success("Post deleted successfully!");
        router.push("/community");
      }),
    );
  };

  const handleAdviseStructure = () => {
    advisor.askAdvisorWithSummaryCallback(
      "Help me structure my problem statement for maximum clarity and effectiveness. I need guidance on how to present my problem in a way that attracts the right solutions and proposals.",
      (summary) => {
        form.setValue("content", summary);
      },
    );
  };

  const handleGenerateDraftFromChat = async () => {
    if (advisor.messages.length <= 1) {
      toast.error("Please have a conversation with the AI advisor first before generating a draft.");
      return;
    }

    await advisor.generateSummaryAndApply((summary) => {
      form.setValue("content", summary);
    });
  };

  const handleEnhanceContent = async () => {
    const currentContent = form.getValues("content");
    const currentTitle = form.getValues("title");
    const currentBudget = form.getValues("budget");

    if (!currentContent || currentContent.trim() === "") {
      toast.error("Please enter some content before enhancing.");
      return;
    }

    await notifyLoading(
      "Enhancing content…",
      backend.ai.enhanceProblemStatement(currentContent, currentTitle, currentBudget).then((enhancedContent) => {
        const cleanedContent = enhancedContent.replace(/```html([\s\S]*?)```/g, "$1").trim();
        form.setValue("content", cleanedContent);
        toast.success("Content enhanced successfully!");
      }),
    );
  };

  useEffect(() => {
    setLoading(true);
    if (mode === "create") {
      form.reset({
        title: "",
        tags: [],
        type: "general",
        content: "",

        // Problems
        budget: undefined,
      });
      setLoading(false);
    } else {
      backend.community
        .getPost(id)
        .then((post) => {
          setPost(post);
          form.reset({
            title: post.title,
            tags: post.tags || [],
            type: post.type,
            content: post.content,

            // Problems
            budget: post.budget || undefined,
          });
        })
        .catch((error) => {
          console.error(error);
          toast.error(error.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, mode]);

  if (loading) {
    return (
      <div className={"my-20"}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <FormWrapper className={"w-full p-4"} form={form} onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "New Post" : "Edit Post"}</CardTitle>
          <CardDescription>
            {mode === "create" ? "Create a new post in the community." : "Update a post"}
          </CardDescription>
        </CardHeader>
        <CardContent className={"space-y-4"}>
          {/* Title */}
          <FormField
            control={form.control}
            name={"title"}
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={"Enter title…"}
                    value={field.value}
                    disabled={formState.isSubmitting}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription />
              </FormItem>
            )}
          />

          {/* Tags */}
          <FormField
            control={form.control}
            name={"tags"}
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Tags>
                    <TagsTrigger>
                      {field.value?.map((tag) => (
                        <TagsValue
                          key={tag}
                          variant={"outline"}
                          onRemove={() => field.onChange(field.value?.filter((item) => item !== tag))}
                        >
                          {tag}
                        </TagsValue>
                      ))}
                    </TagsTrigger>
                    <TagsContent>
                      <TagsInput placeholder={"Search tag…"} disabled={formState.isSubmitting} onValueChange={setTag} />
                      <TagsList>
                        <TagsEmpty>
                          <button
                            disabled={formState.isSubmitting || field.value?.includes(tag)}
                            onClick={() => {
                              const value = tag.trim();
                              if (!value || field.value?.includes(value)) return;
                              field.onChange([...field.value, value]);
                              setTag("");
                            }}
                          >
                            Add Tag: {tag}
                          </button>
                        </TagsEmpty>
                        <TagsGroup>
                          {topicsValues.map((tag) => (
                            <TagsItem
                              key={tag}
                              disabled={formState.isSubmitting || field.value?.includes(tag)}
                              onSelect={() => {
                                if (field.value?.includes(tag)) return;
                                field.onChange([...field.value, tag]);
                              }}
                            >
                              {tag}
                            </TagsItem>
                          ))}
                        </TagsGroup>
                      </TagsList>
                    </TagsContent>
                  </Tags>
                </FormControl>
                <FormDescription />
              </FormItem>
            )}
          />

          {/* Type */}
          <FormField
            control={form.control}
            name={"type"}
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    disabled={formState.isSubmitting || mode === "update"}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className={"w-full"}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"general"}>General Discussion</SelectItem>
                      <SelectItem value={"problem"}>Problem Statement</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription />
              </FormItem>
            )}
          />

          {/* Tabs */}
          <Tabs className={"gap-4"} defaultValue={"general"}>
            {type !== "general" && (
              <TabsList className={"h-12 w-full"}>
                <TabsTrigger value={"general"}>General</TabsTrigger>
                {type === "problem" && (
                  <TabsTrigger value={"proposals"} disabled={mode === "create"}>
                    Proposals
                  </TabsTrigger>
                )}
              </TabsList>
            )}

            {/* General */}
            <TabsContent className={"space-y-4"} value={"general"}>
              {type === "problem" && (
                <>
                  <FormField
                    control={form.control}
                    name={"budget"}
                    render={({ field, formState }) => (
                      <FormItem>
                        <FormLabel>Budget</FormLabel>
                        <FormControl>
                          <Input
                            type={"number"}
                            value={field.value}
                            disabled={formState.isSubmitting}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription />
                      </FormItem>
                    )}
                  />

                  {/* AI Advisor Button */}
                  <div className={"flex justify-center gap-2 [&>*]:flex-1"}>
                    <Button
                      type={"button"}
                      variant={"outline"}
                      size={"sm"}
                      onClick={handleAdviseStructure}
                      disabled={form.formState.isSubmitting}
                    >
                      <LightbulbIcon />
                      <span>Get AI Help for Problem Structure</span>
                    </Button>
                    <Button
                      type={"button"}
                      variant={"outline"}
                      size={"sm"}
                      onClick={handleEnhanceContent}
                      disabled={form.formState.isSubmitting}
                    >
                      <SparklesIcon />
                      <span>Auto-Enhance Content</span>
                    </Button>
                    {advisor.messages.length > 1 && (
                      <Button
                        type={"button"}
                        variant={"outline"}
                        size={"sm"}
                        onClick={handleGenerateDraftFromChat}
                        disabled={form.formState.isSubmitting}
                      >
                        <SparklesIcon />
                        <span>Generate Draft from AI Help</span>
                      </Button>
                    )}
                  </div>
                </>
              )}

              {/* Content */}
              <FormField
                control={form.control}
                name={"content"}
                render={({ field, formState }) => (
                  <FormItem>
                    <FormControl>
                      <RichEditor
                        value={field.value}
                        disabled={formState.isSubmitting}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription />
                  </FormItem>
                )}
              />
            </TabsContent>

            {/* Proposals */}
            {type === "problem" && (
              <TabsContent value={"proposals"}>
                <div className={"text-muted-foreground text-center"}>
                  <p>Proposals functionality will be implemented here.</p>
                  <p className={"mt-2 text-sm"}>
                    This section will allow users to submit and manage proposals for this problem statement.
                  </p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
        <CardFooter className={"flex justify-between"}>
          {mode === "update" && post && post.userId === user?.id && (
            <Popover>
              <PopoverTrigger asChild>
                <Button type={"button"} variant={"destructive"}>
                  <TrashIcon />
                  <span>Delete</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className={"w-80"}>
                <div className={"space-y-3"}>
                  <h4 className={"text-destructive font-medium"}>Delete Post</h4>
                  <p className={"text-muted-foreground text-sm"}>
                    This action cannot be undone. This will permanently delete your post and all its comments.
                  </p>
                  <Button
                    type={"button"}
                    variant={"destructive"}
                    onClick={handleDelete}
                    disabled={form.formState.isSubmitting}
                    className={"w-full"}
                  >
                    Delete Permanently
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Button
            type={"submit"}
            variant={"default"}
            disabled={form.formState.isSubmitting}
            className={mode === "create" ? "w-full" : "ml-auto"}
          >
            <SaveIcon />
            <span>{mode === "create" ? "Submit" : "Update"}</span>
          </Button>
        </CardFooter>
      </Card>
    </FormWrapper>
  );
}
