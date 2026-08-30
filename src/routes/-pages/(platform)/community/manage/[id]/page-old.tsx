"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon, DollarSignIcon, SendIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { RichEditor, RichViewer } from "#/components/ui/custom/rich";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import FormWrapper from "#/components/ui/wrappers/form";
import useBackend from "#/lib/backend/client";
import { useParams, useRouter } from "#/lib/router";
import ProblemStatementTabs from "#/routes/-pages/(platform)/community/manage/[id]/_components/problem-statement-tabs";
import Loading from "#/routes/-pages/loading";

// Step 1 schema - basic post info
const step1Schema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string(),
  tags: z.string().array().optional(),
  budget: z.number().positive().optional(),
  deadline: z.string().optional(),
});

// Step 2 schema - content
const step2Schema = z.object({
  content: z.string().min(1, "Content is required"),
});

// Combined schema for final submission
const fullSchema = z.object({
  title: z.string(),
  type: z.string(),
  tags: z.string().array().optional(),
  content: z.string(),
  budget: z.number().positive().optional(),
  deadline: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type FullData = z.infer<typeof fullSchema>;

export default function Page() {
  const router = useRouter();
  const backend = useBackend();
  const params = useParams();

  const id = params.id as string;
  const mode = id === "new" ? "create" : "update";

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Form for step 1
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      type: "general",
      tags: [],
    },
  });

  // Form for step 2
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      content: "",
    },
  });

  // Handle step 1 completion
  function handleStep1Submit(data: Step1Data) {
    setStep1Data(data);
    setCurrentStep(2);
  }

  // Handle going back to step 1
  function handleBackToStep1() {
    setCurrentStep(1);
  }

  // Handle final form submission
  function handleFinalSubmit(step2Data: Step2Data) {
    if (!step1Data) return;

    const fullData: FullData = {
      ...step1Data,
      ...step2Data,
    };

    // Convert deadline string to ISO format if provided
    if (fullData.deadline) {
      try {
        fullData.deadline = new Date(fullData.deadline).toISOString();
      } catch (error) {
        toast.error("Invalid deadline format");
        return;
      }
    }

    setLoading(true);

    if (mode === "create") {
      backend.community
        .createPost(fullData)
        .then((post) => {
          toast.success("Post created successfully!");
          router.push(`/community/${post.id}`);
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      backend.community
        .updatePost(id, fullData)
        .then((post) => {
          toast.success("Post updated successfully!");
          router.push(`/community/${post.id}`);
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  // Handle post deletion
  async function handleDelete() {
    if (mode !== "update") return;

    setLoading(true);
    await backend.community
      .deletePost(id)
      .then(() => {
        toast.success("Post deleted successfully!");
        router.push("/community/manage");
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    if (mode === "create") {
      setLoading(false);
      return;
    }

    setLoading(true);
    backend.community
      .getPost(id)
      .then((post) => {
        const step1Values = {
          title: post.title,
          type: post.type,
          tags: post.tags ?? [],
          budget: post.budget ?? undefined,
          deadline: post.deadline ? new Date(post.deadline).toISOString().split("T")[0] : undefined,
        };

        step1Form.reset(step1Values);
        step2Form.reset({
          content: post.content,
        });

        // If we're in edit mode, we can populate step1Data and go to step 2
        setStep1Data(step1Values);
        setCurrentStep(2);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, mode]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={"from-background to-muted/20 min-h-screen bg-gradient-to-br"}>
      <div className={"container mx-auto max-w-5xl p-6"}>
        {/* Page Header */}
        <div className={"mb-8 space-y-3 text-center"}>
          <h1 className={"text-3xl font-bold tracking-tight"}>{mode === "create" ? "Create New Post" : "Edit Post"}</h1>
          <p className={"text-muted-foreground text-lg"}>
            {currentStep === 1
              ? "Let's start with the basics - what kind of post are you creating?"
              : "Now let's add your content"}
          </p>

          {/* Step indicator */}
          <div className={"mt-4 flex items-center justify-center gap-2"}>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </div>
            <div className={"bg-muted h-0.5 w-12"} />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <FormWrapper form={step1Form} onSubmit={step1Form.handleSubmit(handleStep1Submit)}>
            <Card className={"bg-card/80 border-0 shadow-lg backdrop-blur-sm"}>
              <CardHeader>
                <CardTitle>Post Information</CardTitle>
                <CardDescription>
                  Tell us about your post - what's it about and what type of discussion you want to have?
                </CardDescription>
              </CardHeader>

              <CardContent className={"space-y-6"}>
                {/* Title */}
                <FormField
                  control={step1Form.control}
                  name={"title"}
                  render={({ field, formState }) => (
                    <FormItem>
                      <FormLabel className={"text-base font-semibold"}>Post Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={"Enter a clear and engaging title..."}
                          value={field.value || ""}
                          disabled={formState.isSubmitting}
                          onChange={field.onChange}
                          className={"h-12 text-lg"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type */}
                <FormField
                  control={step1Form.control}
                  name={"type"}
                  render={({ field, formState }) => (
                    <FormItem>
                      <FormLabel className={"text-base font-semibold"}>Post Type</FormLabel>
                      <FormControl>
                        <Select value={field.value} disabled={formState.isSubmitting} onValueChange={field.onChange}>
                          <SelectTrigger className={"h-12 w-full"}>
                            <SelectValue placeholder={"Select post type"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={"general"}>
                              <div className={"space-y-1"}>
                                <div className={"font-medium"}>General Discussion</div>
                                <div className={"text-muted-foreground text-xs"}>
                                  Share thoughts and ideas with the community
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value={"problem"}>
                              <div className={"space-y-1"}>
                                <div className={"font-medium"}>Problem Seeking Help</div>
                                <div className={"text-muted-foreground text-xs"}>
                                  Define your problems and get structured help
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value={"event"} disabled>
                              <div className={"space-y-1 opacity-50"}>
                                <div className={"font-medium"}>Event Announcement</div>
                                <div className={"text-muted-foreground text-xs"}>Coming Soon</div>
                              </div>
                            </SelectItem>
                            <SelectItem value={"recruit"} disabled>
                              <div className={"space-y-1 opacity-50"}>
                                <div className={"font-medium"}>Team Recruitment</div>
                                <div className={"text-muted-foreground text-xs"}>Coming Soon</div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <FormField
                  control={step1Form.control}
                  name={"tags"}
                  render={({ field, formState }) => (
                    <FormItem>
                      <FormLabel className={"text-base font-semibold"}>Tags</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={"technology, tutorial, help (comma-separated)"}
                          value={field.value?.join(", ") || ""}
                          disabled={formState.isSubmitting}
                          onChange={(e) => {
                            const tags = e.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter((tag) => tag.length > 0);
                            field.onChange(tags);
                          }}
                          className={"h-12"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Budget - only show for certain post types */}
                {(step1Form.watch("type") === "problem" || step1Form.watch("type") === "recruit") && (
                  <FormField
                    control={step1Form.control}
                    name={"budget"}
                    render={({ field, formState }) => (
                      <FormItem>
                        <FormLabel className={"text-base font-semibold"}>
                          Budget (Optional)
                          <span className={"text-muted-foreground ml-2 text-sm"}>
                            {step1Form.watch("type") === "problem"
                              ? "- How much are you willing to pay for help?"
                              : "- Budget for this project"}
                          </span>
                        </FormLabel>
                        <FormControl>
                          <div className={"relative"}>
                            <DollarSignIcon
                              className={
                                "text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
                              }
                            />
                            <Input
                              type={"number"}
                              placeholder={"Enter budget amount"}
                              value={field.value || ""}
                              disabled={formState.isSubmitting}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === "" ? undefined : Number(value));
                              }}
                              className={"h-12 pl-10"}
                              min={0}
                              step={0.01}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Deadline - only show for certain post types */}
                {(step1Form.watch("type") === "problem" || step1Form.watch("type") === "recruit") && (
                  <FormField
                    control={step1Form.control}
                    name={"deadline"}
                    render={({ field, formState }) => (
                      <FormItem>
                        <FormLabel className={"text-base font-semibold"}>
                          Deadline (Optional)
                          <span className={"text-muted-foreground ml-2 text-sm"}>
                            {step1Form.watch("type") === "problem"
                              ? "- When do you need this solved?"
                              : "- When do you need team members?"}
                          </span>
                        </FormLabel>
                        <FormControl>
                          <div className={"relative"}>
                            <CalendarIcon
                              className={
                                "text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
                              }
                            />
                            <Input
                              type={"date"}
                              value={field.value || ""}
                              disabled={formState.isSubmitting}
                              onChange={field.onChange}
                              className={"h-12 pl-10"}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>

              <CardFooter className={"flex justify-end"}>
                <Button type={"submit"} disabled={step1Form.formState.isSubmitting} size={"lg"}>
                  <ArrowRightIcon className={"mr-2 h-4 w-4"} />
                  <span>Next: Add Content</span>
                </Button>
              </CardFooter>
            </Card>
          </FormWrapper>
        )}

        {/* Step 2: Content */}
        {currentStep === 2 && step1Data && (
          <FormWrapper form={step2Form} onSubmit={step2Form.handleSubmit(handleFinalSubmit)}>
            <Card className={"bg-card/80 border-0 shadow-lg backdrop-blur-sm"}>
              <CardHeader>
                <CardTitle>{step1Data.type === "problem" ? "Problem Statement" : "Post Content"}</CardTitle>
                <CardDescription>
                  {step1Data.type === "problem"
                    ? "Use our structured format to clearly define your problem and get better help"
                    : "Write your post content using our rich text editor"}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <FormField
                  control={step2Form.control}
                  name={"content"}
                  render={({ field, formState }) => (
                    <FormItem>
                      <FormControl>
                        {step1Data.type === "problem" ? (
                          <ProblemStatementTabs
                            disabled={formState.isSubmitting}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        ) : (
                          <Tabs defaultValue={"write"} className={"w-full"}>
                            <TabsList className={"grid w-full grid-cols-2"}>
                              <TabsTrigger value={"write"}>Write</TabsTrigger>
                              <TabsTrigger value={"preview"}>Preview</TabsTrigger>
                            </TabsList>
                            <TabsContent value={"write"} className={"mt-4"}>
                              <RichEditor
                                value={field.value}
                                disabled={formState.isSubmitting}
                                onValueChange={field.onChange}
                              />
                            </TabsContent>
                            <TabsContent value={"preview"} className={"mt-4"}>
                              <div className={"min-h-[200px] rounded-lg border p-4"}>
                                <RichViewer content={field.value} />
                              </div>
                            </TabsContent>
                          </Tabs>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter className={"flex items-center justify-between"}>
                <Button type={"button"} variant={"outline"} onClick={handleBackToStep1} size={"lg"}>
                  <ArrowLeftIcon className={"mr-2 h-4 w-4"} />
                  <span>Back</span>
                </Button>

                <div className={"flex gap-3"}>
                  {mode === "update" && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type={"button"} variant={"destructive"} size={"lg"}>
                          <TrashIcon className={"mr-2 h-4 w-4"} />
                          <span>Delete Post</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className={"w-80"}>
                        <div className={"space-y-3"}>
                          <h4 className={"text-destructive font-medium"}>Delete Post</h4>
                          <p className={"text-muted-foreground text-sm"}>
                            This action cannot be undone. This will permanently delete your post.
                          </p>
                          <Button type={"button"} variant={"destructive"} onClick={handleDelete} className={"w-full"}>
                            Delete Permanently
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}

                  <Button
                    type={"submit"}
                    disabled={step2Form.formState.isSubmitting || loading}
                    size={"lg"}
                    className={"min-w-[140px]"}
                  >
                    {step2Form.formState.isSubmitting || loading ? (
                      <div className={"flex items-center gap-2"}>
                        <div
                          className={"h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"}
                        />
                        <span>{mode === "create" ? "Creating..." : "Saving..."}</span>
                      </div>
                    ) : (
                      <>
                        <SendIcon className={"mr-2 h-4 w-4"} />
                        <span>{mode === "create" ? "Create Post" : "Save Changes"}</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </FormWrapper>
        )}
      </div>
    </div>
  );
}
