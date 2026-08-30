import { Message } from "@ai-sdk/react";
import Markdown from "react-markdown";

import ImageWrapper from "#/components/ui/wrappers/image";
import { Service, serviceSchema } from "#/lib/backend/schema";
import Link from "#/lib/router";
import { cn } from "#/lib/utils";

function SearchServicesWidget(props: { data: Service[] }) {
  return (
    <div className={"flex flex-col gap-2"}>
      {props.data.map((service) => (
        <Link
          key={service.id}
          className={"bg-card hover:bg-card/80 flex overflow-hidden rounded-lg border shadow-lg"}
          href={`/services/${service.id}`}
        >
          <ImageWrapper className={"size-16"} src={service.imageUrl} />
          <div className={"p-2"}>
            <h3 className={"line-clamp-1 text-lg font-bold"}>{service.name}</h3>
            <p className={"text-muted-foreground line-clamp-1 text-sm"}>{service.tagline || "No tagline available."}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function AdvisorMessage(props: { data: Message }) {
  return (
    <div className={"flex flex-col"}>
      <div className={cn("w-max max-w-[80%]", props.data.role === "user" && "self-end")}>
        <div
          className={cn(
            "bg-secondary prose prose-sm dark:prose-invert rounded-lg p-2 shadow-lg",
            props.data.role === "user" && "bg-primary text-primary-foreground",
          )}
        >
          <Markdown>{props.data.content}</Markdown>
        </div>
        {props.data.parts && (
          <div className={"mt-2"}>
            {props.data.parts.map((part) => {
              if (part.type !== "tool-invocation") return null;

              const { toolName, toolCallId, state } = part.toolInvocation;

              if (state !== "result") return null;

              if (toolName === "searchServices") {
                const services = serviceSchema.array().parse(part.toolInvocation.result);
                return <SearchServicesWidget key={toolCallId} data={services} />;
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}
