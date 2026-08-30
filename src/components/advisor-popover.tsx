import { BotMessageSquareIcon, MicIcon, SendIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import { ComponentProps } from "react";

import AdvisorMessage from "#/components/advisor-message";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Popover, PopoverContent } from "#/components/ui/popover";
import { useChatInternal } from "#/lib/hooks";
import { useAdvisor } from "#/lib/providers/advisor";

export default function AdvisorPopover(
  props: ComponentProps<typeof Popover> & { data: ReturnType<typeof useChatInternal> },
) {
  const { showAdvisorDialog, showAdvisorDialogWithVoice } = useAdvisor();
  return (
    <Popover {...props}>
      {props.children}
      <PopoverContent className={"mr-4 mb-2 flex max-h-[80vh] min-h-100 w-[95vw] flex-col p-0 sm:w-120"}>
        {/* Header */}
        <div className={"bg-secondary flex border-b p-4"}>
          <div className={"flex flex-1 items-center gap-2"}>
            <BotMessageSquareIcon className={"size-6"} />
            <h1 className={"text-lg font-bold"}>Advisor</h1>
          </div>
          <div>
            <Button aria-label="Open Advisor" variant={"outline"} size={"icon"} onClick={showAdvisorDialog}>
              <SquareArrowOutUpRightIcon />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className={"bg-background flex flex-1 flex-col gap-4 overflow-y-auto p-4"}>
          {props.data.messages.map((message) => (
            <AdvisorMessage key={message.id} data={message} />
          ))}
        </div>

        {/* Input */}
        <form className={"bg-secondary flex gap-2 border-t p-4"} onSubmit={props.data.handleSubmit}>
          <Input
            type={"text"}
            placeholder={"I need help with…"}
            value={props.data.input}
            disabled={props.data.status !== "ready"}
            onChange={props.data.handleInputChange}
          />
          <Button
            aria-label="Start Voice Conversation"
            type={"button"}
            variant={"outline"}
            size={"icon"}
            disabled={props.data.status !== "ready"}
            onClick={showAdvisorDialogWithVoice}
          >
            <MicIcon />
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
      </PopoverContent>
    </Popover>
  );
}
