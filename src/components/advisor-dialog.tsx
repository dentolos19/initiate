import { BotMessageSquareIcon, ChevronDownIcon, SendIcon, SparklesIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ComponentProps, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import AdvisorMessage from "#/components/advisor-message";
import { Button } from "#/components/ui/button";
import { Dialog, DialogContent } from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import useBackend from "#/lib/backend/client";
import { useChatInternal } from "#/lib/hooks";
import { cn } from "#/lib/utils";

export default function AdvisorDialog(
  props: ComponentProps<typeof Dialog> & {
    data: ReturnType<typeof useChatInternal>;
    onSummaryGenerated?: (summary: string) => void;
  },
) {
  const backend = useBackend();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [suggestions, setSuggestions] = useState<string[]>([
    "Can you help me find a solution for my problem?",
    "How can I improve my employees productivity?",
    "What are the best tools for project management?",
  ]);
  const [hideSuggestions, setHideSuggestions] = useState<boolean>(false);

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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [props.data.messages.length]);

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

  return (
    <Dialog {...props}>
      {props.children}
      <DialogContent className={"flex h-[95%] w-[95%] flex-col gap-0 p-0 sm:max-w-none"}>
        {/* Header */}
        <div className={"flex items-center justify-between border-b bg-secondary p-4"}>
          <div className={"flex flex-1 items-center gap-2"}>
            <BotMessageSquareIcon className={"size-6"} />
            <h1 className={"text-lg font-bold"}>Advisor</h1>
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
                  disabled={props.data.status !== "ready"}
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
        <form className={"z-20 flex gap-2 border-t bg-secondary p-4"} onSubmit={props.data.handleSubmit}>
          <Input
            type={"text"}
            placeholder={"Say something…"}
            value={props.data.input}
            disabled={props.data.status !== "ready"}
            onChange={props.data.handleInputChange}
          />
          <Button
            aria-label={hideSuggestions ? "Show Suggestions" : "Hide Suggestions"}
            type={"button"}
            variant={"outline"}
            size={"icon"}
            disabled={props.data.status !== "ready"}
            onClick={() => setHideSuggestions(!hideSuggestions)}
          >
            <ChevronDownIcon className={cn("transition", hideSuggestions && "rotate-180")} />
          </Button>
          <Button
            aria-label="Send Message"
            type={"submit"}
            variant={"default"}
            size={"icon"}
            disabled={props.data.status !== "ready"}
          >
            <SendIcon />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
