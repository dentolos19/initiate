import { useConversation } from "@elevenlabs/react";
import {
  BotMessageSquareIcon,
  ChevronDownIcon,
  Mic,
  MicIcon,
  MicOffIcon,
  SendIcon,
  SparklesIcon,
  Volume2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ComponentProps, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import AdvisorMessage from "#/components/advisor-message";
import { Button } from "#/components/ui/button";
import { Dialog, DialogContent } from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import useBackend from "#/lib/backend/client";
import { useChatInternal } from "#/lib/hooks";
import { useSession } from "#/lib/providers/session";
import { cn } from "#/lib/utils";

// Voice status indicator components
function VoiceTranscriptIndicator({ transcript }: { transcript: string }) {
  return (
    <motion.div
      className={"w-max max-w-[80%] self-end"}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={
          "rounded-lg border-2 border-blue-300 bg-blue-100 p-3 shadow-lg dark:border-blue-700 dark:bg-blue-900/30"
        }
      >
        <div className={"mb-2 flex items-center gap-2"}>
          <Mic className={"size-3 animate-pulse text-blue-500"} />
          <span className={"text-xs font-medium text-blue-600 dark:text-blue-400"}>You're speaking…</span>
        </div>
        <p className={"min-h-[1rem] text-sm text-blue-800 dark:text-blue-200"}>{transcript}</p>
      </div>
    </motion.div>
  );
}

function AISpeakingIndicator() {
  return (
    <motion.div
      className={"w-max max-w-[80%]"}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={
          "rounded-lg border-2 border-green-300 bg-green-100 p-3 shadow-lg dark:border-green-700 dark:bg-green-900/30"
        }
      >
        <div className={"flex items-center gap-2"}>
          <Volume2 className={"size-3 animate-pulse text-green-500"} />
          <span className={"text-xs font-medium text-green-600 dark:text-green-400"}>AI is speaking…</span>
          <div className={"ml-2 flex gap-1"}>
            <div className={"h-1.5 w-1.5 animate-bounce rounded-full bg-green-500"}></div>
            <div
              className={"h-1.5 w-1.5 animate-bounce rounded-full bg-green-500"}
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className={"h-1.5 w-1.5 animate-bounce rounded-full bg-green-500"}
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdvisorDialog(
  props: ComponentProps<typeof Dialog> & {
    data: ReturnType<typeof useChatInternal>;
    enableVoiceOnOpen?: boolean;
    onSummaryGenerated?: (summary: string) => void;
  },
) {
  const backend = useBackend();
  const session = useSession();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Text
  const [suggestions, setSuggestions] = useState<string[]>([
    "Can you help me find a solution for my problem?",
    "How can I improve my employees productivity?",
    "What are the best tools for project management?",
  ]);
  const [hideSuggestions, setHideSuggestions] = useState<boolean>(false);

  // Voice
  const [voiceLoading, setVoiceLoading] = useState<boolean>(false);
  const [voiceConnected, setVoiceConnected] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");
  const [isAISpeaking, setIsAISpeaking] = useState<boolean>(false);
  const hasVoiceInitialized = useRef<boolean>(false);
  const voiceRequestId = useRef(0);

  const conversation = useConversation({
    onConnect: () => {
      setVoiceLoading(false);
      setVoiceConnected(true);
      setVoiceError("");
    },
    onDisconnect: () => {
      setVoiceLoading(false);
      setVoiceConnected(false);
      setIsAISpeaking(false);
      setCurrentTranscript("");
    },
    onMessage: (message) => {
      if (message.source === "ai") {
        props.data.setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            parts: [{ type: "text", text: message.message || "" }],
          },
        ]);
      }

      if (message.source === "user") {
        props.data.setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: crypto.randomUUID(),
            role: "user",
            parts: [{ type: "text", text: message.message || "" }],
          },
        ]);
      }
    },
    onError: (errorMessage) => {
      console.error("ElevenLabs conversation error:", errorMessage);
      setVoiceLoading(false);
      hasVoiceInitialized.current = false;
      setVoiceError(errorMessage);
      setIsAISpeaking(false);
      setCurrentTranscript("");
      toast.error(`Voice Error: ${errorMessage}`);
    },
    onModeChange: (mode) => {
      setIsListening(mode.mode === "listening");

      if (mode.mode !== "listening") {
        setCurrentTranscript("");
      }
    },
  });
  const { startSession, endSession } = conversation;

  const suggestMessages = async (suggestion: string) => {
    // handle special case for summary generation
    if (
      suggestion.toLowerCase().includes("skip all questions and generate draft") ||
      suggestion.toLowerCase().includes("generate draft")
    ) {
      if (props.data.messages.length <= 1) {
        toast.error("No conversation available to summarize.");
        return;
      }

      try {
        const summary = await backend.ai.generateProblemStatementSummary(props.data.messages);

        // if callback is provided, use it
        if (props.onSummaryGenerated) {
          props.onSummaryGenerated(summary);
        }

        toast.success("Summary generated and applied successfully!");

        // close the dialog after generating summary
        if (props.onOpenChange) {
          props.onOpenChange(false);
        }
        return;
      } catch (error) {
        console.error(error);
        toast.error("Failed to generate summary. Please try again.");
        return;
      }
    }

    // normal suggestion handling
    await props.data.sendMessage({
      text: suggestion,
    });
  };

  const initializeVoiceChat = useCallback(async () => {
    if (hasVoiceInitialized.current) return;
    hasVoiceInitialized.current = true;
    const requestId = ++voiceRequestId.current;

    try {
      setVoiceLoading(true);
      setVoiceError("");

      const agentId = await backend.ai.getAgent();
      if (requestId !== voiceRequestId.current) return;

      startSession({
        agentId,
        connectionType: "websocket",
        dynamicVariables: {
          user_id: session.user?.id || "",
          organization_id: session.organization?.id || "",
        },
      });
    } catch (error) {
      if (requestId !== voiceRequestId.current) return;
      console.error("Failed to start voice chat:", error);
      const errorMessage = error instanceof Error ? error.message : "Voice connection failed";
      setVoiceError(errorMessage);
      toast.error(`Voice setup failed: ${errorMessage}`);
      hasVoiceInitialized.current = false; // Reset so user can try again
      setVoiceLoading(false);
    }
  }, [backend.ai, session.organization?.id, session.user?.id, startSession]);

  const toggleVoice = useCallback(async () => {
    if (!isVoiceEnabled) {
      setIsVoiceEnabled(true);
      await initializeVoiceChat();
    } else {
      setIsVoiceEnabled(false);
      voiceRequestId.current++;
      endSession();
      setVoiceLoading(false);
      setVoiceConnected(false);
      setIsAISpeaking(false);
      setCurrentTranscript("");
      hasVoiceInitialized.current = false;
    }
  }, [endSession, initializeVoiceChat, isVoiceEnabled]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [props.data.messages.length, currentTranscript, isAISpeaking]);

  useEffect(() => {
    if (props.data.status !== "ready") return;
    if (props.data.messages.length < 2) return;

    let active = true;
    setSuggestions([]);
    backend.ai
      .generateSuggestions(props.data.messages)
      .then((suggestions) => {
        if (active) setSuggestions(suggestions);
      })
      .catch((error) => {
        console.error(error);
        if (active) setSuggestions([]);
      });
    return () => {
      active = false;
    };
  }, [props.data.status, props.data.messages, backend.ai]);

  useEffect(() => {
    if (!props.open && isVoiceEnabled) {
      setIsVoiceEnabled(false);
      voiceRequestId.current++;
      endSession();
      setVoiceLoading(false);
      setVoiceConnected(false);
      setIsAISpeaking(false);
      setCurrentTranscript("");
      hasVoiceInitialized.current = false;
      return;
    }

    // Auto-enable voice if requested
    if (props.open && props.enableVoiceOnOpen && !isVoiceEnabled && !hasVoiceInitialized.current) {
      toggleVoice();
    }
  }, [props.open, props.enableVoiceOnOpen, isVoiceEnabled, endSession, toggleVoice]);

  useEffect(() => {
    const requestId = voiceRequestId;
    return () => {
      requestId.current++;
      endSession();
    };
  }, [endSession]);

  return (
    <Dialog {...props}>
      {props.children}
      <DialogContent className={"flex h-[95%] w-[95%] flex-col gap-0 p-0 sm:max-w-none"}>
        {/* Header */}
        <div className={"bg-secondary flex items-center justify-between border-b p-4"}>
          <div className={"flex flex-1 items-center gap-2"}>
            <BotMessageSquareIcon className={"size-6"} />
            <h1 className={"text-lg font-bold"}>
              Advisor
              {isVoiceEnabled && voiceConnected && (
                <span className={"text-muted-foreground ml-2 text-sm font-normal"}>• Voice enabled</span>
              )}
            </h1>
            {isVoiceEnabled && (
              <div className={"ml-4 flex items-center gap-2"}>
                {voiceLoading ? (
                  <div className={"flex items-center gap-1 text-sm text-blue-500"}>
                    <div
                      className={
                        "h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-blue-500 motion-reduce:animate-none"
                      }
                    ></div>
                    <span>Connecting voice…</span>
                  </div>
                ) : voiceError ? (
                  <div className={"text-sm text-red-500"}>Voice Error</div>
                ) : conversation.isSpeaking || isAISpeaking ? (
                  <div className={"flex items-center gap-1 text-sm text-green-500"}>
                    <Volume2 className={"size-4 animate-pulse"} />
                    <span>Speaking</span>
                  </div>
                ) : isListening ? (
                  <div className={"flex items-center gap-1 text-sm text-blue-500"}>
                    <Mic className={"size-4 animate-pulse"} />
                    <span>Listening{currentTranscript && "…"}</span>
                  </div>
                ) : voiceConnected ? (
                  <div className={"flex items-center gap-1 text-sm text-green-500"}>
                    <Mic className={"size-4"} />
                    <span>Ready</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className={"flex flex-1 flex-col gap-4 overflow-y-auto p-4"}>
          {props.data.messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AdvisorMessage data={message} />
            </motion.div>
          ))}

          {/* Real-time voice indicators */}
          <AnimatePresence>
            {isVoiceEnabled && currentTranscript && <VoiceTranscriptIndicator transcript={currentTranscript} />}
            {isVoiceEnabled && (conversation.isSpeaking || isAISpeaking) && <AISpeakingIndicator />}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        <AnimatePresence>
          {!hideSuggestions && suggestions.length > 0 && (
            <motion.div
              className={"z-10 flex flex-wrap gap-2 border-t p-4"}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  className={"shadow"}
                  type={"button"}
                  variant={"secondary"}
                  disabled={props.data.status !== "ready" || voiceLoading}
                  onClick={() => suggestMessages(suggestion)}
                >
                  <SparklesIcon className={"size-4"} />
                  <span>{suggestion}</span>
                </Button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <form className={"bg-secondary z-20 flex gap-2 border-t p-4"} onSubmit={props.data.handleSubmit}>
          <Input
            type={"text"}
            placeholder={isVoiceEnabled && voiceConnected ? "Type or speak your message…" : "Say something…"}
            value={props.data.input}
            disabled={props.data.status !== "ready" || voiceLoading}
            onChange={props.data.handleInputChange}
          />
          <Button
            aria-label={hideSuggestions ? "Show Suggestions" : "Hide Suggestions"}
            type={"button"}
            variant={"outline"}
            size={"icon"}
            disabled={props.data.status !== "ready" || voiceLoading}
            onClick={() => setHideSuggestions(!hideSuggestions)}
          >
            <ChevronDownIcon className={cn("transition", hideSuggestions && "rotate-180")} />
          </Button>
          {/* {isVoiceEnabled && isVoiceConnected && (
            <Button
              aria-label="Voice Status"
              type={"button"}
              variant={(conversation.isSpeaking || isAISpeaking) ? "default" : isListening ? "secondary" : "outline"}
              size={"icon"}
              className={cn(
                (conversation.isSpeaking || isAISpeaking) && "bg-green-600 hover:bg-green-700",
                isListening && "bg-blue-600 hover:bg-blue-700 animate-pulse"
              )}
              disabled={!isVoiceConnected || isVoiceLoading}
              title={(conversation.isSpeaking || isAISpeaking) ? "AI is speaking…" : isListening ? "Listening…" : "Ready for voice"}
            >
              {(conversation.isSpeaking || isAISpeaking) ? (
                <Volume2 className={"size-4"} />
              ) : (
                <Mic className={"size-4"} />
              )}
            </Button>
          )} */}
          <Button
            aria-label={isVoiceEnabled ? "Disable Voice" : "Enable Voice"}
            className={cn(
              "flex items-center gap-2",
              isVoiceEnabled &&
                (conversation.isSpeaking || isAISpeaking
                  ? "bg-green-600 hover:bg-green-700"
                  : isListening
                    ? "bg-blue-600 hover:bg-blue-700"
                    : voiceConnected
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-600 hover:bg-gray-700"),
            )}
            type={"button"}
            variant={isVoiceEnabled ? "default" : "outline"}
            size={"icon"}
            disabled={voiceLoading}
            onClick={toggleVoice}
          >
            {voiceLoading ? (
              <div
                className={
                  "h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none"
                }
              />
            ) : isVoiceEnabled ? (
              <MicOffIcon className={"size-4"} />
            ) : (
              <MicIcon className={"size-4"} />
            )}
          </Button>
          <Button
            aria-label="Send Message"
            type={"submit"}
            variant={"default"}
            size={"icon"}
            disabled={props.data.status !== "ready" || voiceLoading}
          >
            <SendIcon />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
