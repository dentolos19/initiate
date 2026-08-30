import { BotMessageSquareIcon } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { toast } from "sonner";

import AdvisorDialog from "#/components/advisor-dialog";
import AdvisorPopover from "#/components/advisor-popover";
import { PopoverTrigger } from "#/components/ui/popover";
import useBackend from "#/lib/backend/client";
import { useChatInternal } from "#/lib/hooks";
import { cn, notifyLoading } from "#/lib/utils";
import { LayoutProps } from "#/types";

const AdvisorContext = createContext<{
  askAdvisor: (message?: string) => void;
  showAdvisorButton: () => void;
  hideAdvisorButton: () => void;
  showAdvisorPopover: () => void;
  hideAdvisorPopover: () => void;
  showAdvisorDialog: () => void;
  hideAdvisorDialog: () => void;
  showAdvisorDialogWithVoice: () => void;
  generateSummaryAndApply: (callback?: (summary: string) => void) => Promise<void>;
  askAdvisorWithSummaryCallback: (message?: string, callback?: (summary: string) => void) => void;
  messages: any[];
}>({
  askAdvisor: () => {},
  showAdvisorButton: () => {},
  hideAdvisorButton: () => {},
  showAdvisorPopover: () => {},
  hideAdvisorPopover: () => {},
  showAdvisorDialog: () => {},
  hideAdvisorDialog: () => {},
  showAdvisorDialogWithVoice: () => {},
  generateSummaryAndApply: async () => {},
  askAdvisorWithSummaryCallback: () => {},
  messages: [],
});

export function useAdvisor() {
  return useContext(AdvisorContext);
}

export default function AdvisorProvider(props: LayoutProps) {
  const backend = useBackend();
  const [buttonVisible, setButtonVisible] = useState<boolean>(true);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [enableVoiceOnOpen, setEnableVoiceOnOpen] = useState<boolean>(false);
  const [summaryCallback, setSummaryCallback] = useState<((summary: string) => void) | undefined>();

  const chat = useChatInternal({
    initialMessages: [
      {
        id: "initial",
        role: "assistant",
        content: "Hello! How can I assist you today?",
      },
    ],
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function askAdvisor(message?: string) {
    setPopoverOpen(true);
    if (message) {
      chat.append({
        role: "user",
        content: message,
      });
    }
  }

  function showAdvisorButton() {
    setButtonVisible(true);
  }

  function hideAdvisorButton() {
    setButtonVisible(false);
  }

  function showAdvisorPopover() {
    setPopoverOpen(true);
    setDialogOpen(false);
  }

  function hideAdvisorPopover() {
    setPopoverOpen(false);
  }

  function showAdvisorDialog() {
    setEnableVoiceOnOpen(false);
    setDialogOpen(true);
    setPopoverOpen(false);
  }

  function showAdvisorDialogWithVoice() {
    setEnableVoiceOnOpen(true);
    setDialogOpen(true);
    setPopoverOpen(false);
  }

  function hideAdvisorDialog() {
    setDialogOpen(false);
    setEnableVoiceOnOpen(false);
    setSummaryCallback(undefined);
  }

  function askAdvisorWithSummaryCallback(message?: string, callback?: (summary: string) => void) {
    setSummaryCallback(() => callback);
    setDialogOpen(true);
    setPopoverOpen(false);
    if (message) {
      chat.append({
        role: "user",
        content: message,
      });
    }
  }

  async function generateSummaryAndApply(callback?: (summary: string) => void) {
    if (chat.messages.length <= 1) {
      toast.error("No conversation available to summarize.");
      return;
    }

    setSummaryCallback(() => callback);
    setDialogOpen(true);

    // auto-generate summary immediately if callback is provided
    if (callback) {
      const summary = await notifyLoading(
        "Generating problem statement summary...",
        backend.ai.generateProblemStatementSummary(chat.messages),
      );
      callback(summary);
      hideAdvisorDialog();
      toast.success("Summary generated and applied successfully!");
    }
  }

  return (
    <AdvisorContext.Provider
      value={{
        askAdvisor,
        showAdvisorButton,
        hideAdvisorButton,
        showAdvisorPopover,
        hideAdvisorPopover,
        showAdvisorDialog,
        hideAdvisorDialog,
        showAdvisorDialogWithVoice,
        generateSummaryAndApply,
        askAdvisorWithSummaryCallback,
        messages: chat.messages,
      }}
    >
      {props.children}

      {/* Advisor Popover */}
      <AdvisorPopover open={popoverOpen} onOpenChange={setPopoverOpen} data={chat}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "bg-secondary absolute right-4 bottom-4 z-50 cursor-pointer rounded-lg border p-3 transition",
              buttonVisible || "hidden",
            )}
            onClick={() => setPopoverOpen(true)}
          >
            <BotMessageSquareIcon className={"size-5"} />
          </button>
        </PopoverTrigger>
      </AdvisorPopover>

      {/* Advisor Dialog */}
      <AdvisorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        data={chat}
        enableVoiceOnOpen={enableVoiceOnOpen}
        onSummaryGenerated={summaryCallback}
      />
    </AdvisorContext.Provider>
  );
}
