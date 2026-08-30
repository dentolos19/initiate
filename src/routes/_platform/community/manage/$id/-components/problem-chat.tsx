import { useChat } from "@ai-sdk/react";
import { BotIcon, SendIcon, SkipForwardIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { ScrollArea } from "#/components/ui/scroll-area";
import { Separator } from "#/components/ui/separator";
import { BACKEND_URL } from "#/environment";
import useBackend from "#/lib/backend/client";
import ProblemMessage from "#/routes/_platform/community/manage/$id/-components/problem-message";

interface ProblemChatProps {
  disabled?: boolean;
  onDraftGenerated?: (draft: any) => void;
}

export default function ProblemChat({ disabled = false, onDraftGenerated }: ProblemChatProps) {
  const backend = useBackend();
  const [conversationStage, setConversationStage] = useState<"initial" | "gathering" | "complete">("initial");

  const chat = useChat({
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content:
          "Hi! I'm here to help you define your problem statement. Let's work together to create a clear and detailed description of what you're trying to solve. What challenge are you facing?",
      },
    ],
    api: `${BACKEND_URL}/problem/chat`,
    fetch: backend.primitives.fetch,
    sendExtraMessageFields: true,
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error(error.message || "Failed to send message");
    },
    onFinish: async (message, { finishReason: _finishReason }) => {
      if (
        (message.role === "assistant" && message.content.toLowerCase().includes("summary")) ||
        message.content.toLowerCase().includes("ready to generate") ||
        chat.messages.length >= 8
      ) {
        setConversationStage("complete");
      } else if (chat.messages.length > 2) {
        setConversationStage("gathering");
      }
    },
  });

  const handleGenerateDraft = async () => {
    try {
      const draft = await backend.problemChat.generateProblemDraft(chat.messages);
      onDraftGenerated?.(draft);
      toast.success("Problem statement draft generated successfully!");
    } catch (error) {
      console.error("Failed to generate draft:", error);
      toast.error("Failed to generate problem draft");
    }
  };

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat.messages]);

  const handleSkip = async () => {
    if (chat.isLoading) return;

    await chat.append({
      role: "user",
      content: "Skip this question",
    });
  };

  const handleSkipAll = async () => {
    if (chat.isLoading) return;

    await chat.append({
      role: "user",
      content: "Skip all remaining questions and generate the draft",
    });

    // Generate draft immediately when skipping all
    setTimeout(() => handleGenerateDraft(), 1000);
  };

  return (
    <Card className={"flex h-[500px] flex-col"}>
      <CardContent className={"flex h-full flex-col p-0"}>
        <ScrollArea className="max-h-[350px] flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {chat.messages.map((message) => (
              <ProblemMessage key={message.id} data={message} />
            ))}

            {chat.isLoading && (
              <div className="flex justify-start gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src="/assets/logo.png" alt="AI Assistant" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <BotIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="size-2 animate-pulse rounded-full bg-current [animation-delay:-0.3s] motion-reduce:animate-none" />
                    <div className="size-2 animate-pulse rounded-full bg-current [animation-delay:-0.15s] motion-reduce:animate-none" />
                    <div className="size-2 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Input Area */}
        <div className={"space-y-3 p-4"}>
          {/* Progress indicator */}
          {conversationStage !== "initial" && (
            <div className={"text-muted-foreground mb-2 text-center text-xs"}>
              {conversationStage === "gathering" && (
                <span>Gathering information… ({chat.messages.length - 1} questions answered)</span>
              )}
              {conversationStage === "complete" && <span>Ready to generate your problem statement!</span>}
            </div>
          )}

          {/* Suggested Actions */}
          <div className={"flex justify-between gap-2"}>
            <div className={"flex gap-2"}>
              {conversationStage === "complete" && (
                <Button type={"button"} size={"sm"} disabled={disabled || chat.isLoading} onClick={handleGenerateDraft}>
                  Generate Draft
                </Button>
              )}
            </div>

            <div className={"flex gap-2"}>
              <Button
                type={"button"}
                variant={"outline"}
                size={"sm"}
                disabled={disabled || chat.isLoading}
                onClick={handleSkip}
              >
                <SkipForwardIcon className={"h-3 w-3"} />
                <span>Skip</span>
              </Button>
              <Button
                type={"button"}
                variant={"outline"}
                size={"sm"}
                disabled={disabled || chat.isLoading}
                onClick={handleSkipAll}
              >
                <SkipForwardIcon className={"h-3 w-3"} />
                <span>Skip All</span>
              </Button>
            </div>
          </div>

          {/* Message Input */}
          <div className={"flex gap-2"}>
            <Input
              value={chat.input}
              onChange={chat.handleInputChange}
              placeholder={"Type your message…"}
              disabled={disabled || chat.isLoading}
              className={"flex-1"}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (chat.input.trim()) {
                    chat.handleSubmit(e);
                  }
                }
              }}
            />
            <Button
              aria-label="Send Message"
              type={"button"}
              disabled={disabled || chat.isLoading || !chat.input.trim()}
              size={"icon"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (chat.input.trim()) {
                  chat.handleSubmit(e);
                }
              }}
            >
              <SendIcon className={"h-4 w-4"} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
