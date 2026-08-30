import { Message } from "@ai-sdk/react";
import { BotIcon, UserIcon } from "lucide-react";
import Markdown from "react-markdown";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { cn } from "#/lib/utils";

export default function ProblemMessage(props: { data: Message }) {
  return (
    <div className={`flex gap-3 ${props.data.role === "user" ? "justify-end" : "justify-start"}`}>
      {props.data.role === "assistant" && (
        <Avatar className={"h-8 w-8 shrink-0"}>
          <AvatarImage src={"/assets/logo.png"} alt={"AI Assistant"} />
          <AvatarFallback className={"bg-primary text-primary-foreground"}>
            <BotIcon className={"h-4 w-4"} />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          props.data.role === "user"
            ? "bg-primary text-primary-foreground ml-auto"
            : "bg-muted prose prose-sm dark:prose-invert",
        )}
      >
        {props.data.role === "assistant" ? (
          <Markdown>{props.data.content}</Markdown>
        ) : (
          <p className={"text-sm whitespace-pre-wrap"}>{props.data.content}</p>
        )}
      </div>

      {props.data.role === "user" && (
        <Avatar className={"h-8 w-8 shrink-0"}>
          <AvatarFallback className={"bg-secondary"}>
            <UserIcon className={"h-4 w-4"} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
