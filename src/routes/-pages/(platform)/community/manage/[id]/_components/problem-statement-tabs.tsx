"use client";

import { CheckIcon, EditIcon, EyeIcon, MessageSquareIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { RichEditor, RichViewer } from "#/components/ui/custom/rich";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { ProblemDraft } from "#/lib/backend/connectors/problem-chat";
import ProblemChat from "#/routes/-pages/(platform)/community/manage/[id]/_components/problem-chat";

interface ProblemStatementTabsProps {
  disabled?: boolean;
  onComplete?: (draft: ProblemDraft) => void;
  onChange?: (content: string) => void;
  value?: string;
}

export default function ProblemStatementTabs({
  disabled = false,
  onComplete,
  onChange,
  value,
}: ProblemStatementTabsProps) {
  const [draft, setDraft] = useState<ProblemDraft | null>(null);
  const [activeTab, setActiveTab] = useState("describe");
  const [isEditing, setIsEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState<ProblemDraft | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (value && !isInitialized) {
      const existingDraft: ProblemDraft = {
        description: value,
        budget: "",
        deadline: "",
      };
      setDraft(existingDraft);
      setEditedDraft(existingDraft);
      setActiveTab("review");
      setIsEditing(true);
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  const handleDraftGenerated = (generatedDraft: ProblemDraft) => {
    setDraft(generatedDraft);
    setEditedDraft(generatedDraft);
    toast.success("Problem statement draft generated successfully!");
    setActiveTab("review");
    if (onChange) {
      onChange(generatedDraft.description);
    }
  };

  const handleSkipAI = () => {
    const emptyDraft: ProblemDraft = {
      description: "",
      budget: "",
      deadline: "",
    };
    setDraft(emptyDraft);
    setEditedDraft(emptyDraft);
    setActiveTab("review");
    setIsEditing(true);
  };

  const handleSaveDraft = () => {
    if (editedDraft) {
      setDraft(editedDraft);
      setIsEditing(false);
      if (onChange) {
        onChange(editedDraft.description);
      }
    }
  };

  useEffect(() => {
    if (editedDraft && onChange) {
      onChange(editedDraft.description);
    }
  }, [editedDraft?.description, onChange]);

  const handleComplete = () => {
    const finalDraft = editedDraft || draft;
    if (finalDraft) {
      if (onChange) {
        onChange(finalDraft.description);
      }
      if (onComplete) {
        onComplete(finalDraft);
      }
      toast.success("Problem statement completed and ready for submission!");
    }
  };

  return (
    <div className={"space-y-6"}>
      {/* Header */}
      <div className={"space-y-2 text-center"}>
        <h2 className={"text-2xl font-bold"}>Create Your Problem Statement</h2>
        <p className={"text-muted-foreground"}>
          Work with our AI assistant to articulate your problem clearly, then review and refine your statement.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className={"w-full"}>
        <TabsList className={"grid h-12 w-full grid-cols-2"}>
          <TabsTrigger
            value={"describe"}
            disabled={disabled}
            className={
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            }
          >
            <MessageSquareIcon className={"h-4 w-4"} />
            <span className={"hidden sm:inline"}>Describe Problem</span>
            <span className={"sm:hidden"}>Describe</span>
          </TabsTrigger>
          <TabsTrigger
            value={"review"}
            disabled={disabled || !draft}
            className={
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2"
            }
          >
            <EyeIcon className={"h-4 w-4"} />
            <span className={"hidden sm:inline"}>Review & Finalize</span>
            <span className={"sm:hidden"}>Review</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={"describe"} className={"mt-6"}>
          <Card>
            <CardHeader>
              <CardTitle className={"flex items-center gap-2"}>
                <MessageSquareIcon className={"text-primary h-5 w-5"} />
                Describe Your Problem
              </CardTitle>
              <CardDescription>
                Chat with our AI assistant to help articulate your problem statement. The assistant will ask follow-up
                questions to ensure your problem is clearly defined and gather all necessary details.
              </CardDescription>
              <div className={"flex justify-end"}>
                <Button variant={"outline"} size={"sm"} onClick={handleSkipAI} disabled={disabled}>
                  <EditIcon className={"mr-2 h-4 w-4"} />
                  Skip AI Help & Write Manually
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ProblemChat disabled={disabled} onDraftGenerated={handleDraftGenerated} />

              {!draft && (
                <div className={"bg-muted/50 mt-4 rounded-lg p-3"}>
                  <p className={"text-muted-foreground text-sm"}>
                    <strong>Tip:</strong> Be as specific as possible about your challenge. The more details you provide,
                    the better your problem statement will be.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value={"review"} className={"mt-6"}>
          <Card>
            <CardHeader>
              <CardTitle className={"flex items-center gap-2"}>
                <EyeIcon className={"text-primary h-5 w-5"} />
                Review Your Problem Statement
              </CardTitle>
              <CardDescription>
                Review the generated problem statement below. You can edit any section to make final adjustments before
                submitting.
              </CardDescription>
            </CardHeader>
            <CardContent className={"space-y-6"}>
              {draft ? (
                <>
                  {/* Description Section */}
                  <div className={"space-y-3"}>
                    <div className={"flex items-center justify-between"}>
                      <h3 className={"flex items-center gap-2 text-lg font-semibold"}>
                        Problem Description
                        <Badge variant={"outline"} className={"text-xs"}>
                          Required
                        </Badge>
                      </h3>
                      <Button variant={"outline"} size={"sm"} onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? <EyeIcon className={"h-4 w-4"} /> : <EditIcon className={"h-4 w-4"} />}
                        {isEditing ? "Preview" : "Edit"}
                      </Button>
                    </div>

                    {isEditing ? (
                      <RichEditor
                        value={editedDraft?.description || ""}
                        onValueChange={(value) => setEditedDraft((prev) => ({ ...prev!, description: value }))}
                        placeholder={"Describe your problem in detail..."}
                      />
                    ) : (
                      <div className={"rounded-lg border p-4"}>
                        <RichViewer content={editedDraft?.description || draft.description} />
                      </div>
                    )}

                    <p className={"text-muted-foreground text-xs"}>
                      This description was generated based on your conversation. Feel free to make any adjustments.
                    </p>
                  </div>

                  {/* Budget Section */}
                  {(draft.budget || isEditing) && (
                    <div className={"space-y-3"}>
                      <h3 className={"flex items-center gap-2 text-lg font-semibold"}>
                        Budget Information
                        <Badge variant={"outline"} className={"text-xs"}>
                          Optional
                        </Badge>
                      </h3>
                      {isEditing ? (
                        <RichEditor
                          value={editedDraft?.budget || ""}
                          onValueChange={(value) => setEditedDraft((prev) => ({ ...prev!, budget: value }))}
                          placeholder={"Enter budget details (optional)..."}
                        />
                      ) : (
                        <div className={"rounded-lg border p-4"}>
                          <RichViewer content={editedDraft?.budget || draft.budget || "No budget specified"} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Deadline Section */}
                  {(draft.deadline || isEditing) && (
                    <div className={"space-y-3"}>
                      <h3 className={"flex items-center gap-2 text-lg font-semibold"}>
                        Deadline Information
                        <Badge variant={"outline"} className={"text-xs"}>
                          Optional
                        </Badge>
                      </h3>
                      {isEditing ? (
                        <RichEditor
                          value={editedDraft?.deadline || ""}
                          onValueChange={(value) => setEditedDraft((prev) => ({ ...prev!, deadline: value }))}
                          placeholder={"Enter deadline details (optional)..."}
                        />
                      ) : (
                        <div className={"rounded-lg border p-4"}>
                          <RichViewer content={editedDraft?.deadline || draft.deadline || "No deadline specified"} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className={"flex gap-3 border-t pt-6"}>
                    {isEditing && (
                      <Button onClick={handleSaveDraft} variant={"outline"}>
                        Save Changes
                      </Button>
                    )}
                    <Button onClick={handleComplete} className={"ml-auto"} size={"lg"}>
                      <CheckIcon className={"mr-2 h-4 w-4"} />
                      Complete Problem Statement
                    </Button>
                  </div>
                </>
              ) : (
                <div className={"text-muted-foreground space-y-4 py-12 text-center"}>
                  <div>
                    <p className={"text-lg font-medium"}>No problem statement generated yet</p>
                    <p className={"text-sm"}>
                      Complete the conversation in the "Describe Problem" tab to generate your problem statement.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
