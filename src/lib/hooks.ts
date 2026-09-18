import { useChat, type UseChatOptions } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { ChangeEvent, SyntheticEvent } from "react";
import { useEffect, useState } from "react";

import { BACKEND_URL } from "#/environment";
import useBackend from "#/lib/backend/client";
import { useSearchParams } from "#/lib/router";

export function useChatInternal(options: UseChatOptions<UIMessage> & { api?: string } = {}) {
  const backend = useBackend();
  const [input, setInput] = useState("");
  const { api = `${BACKEND_URL}/ai/chat`, ...chatOptions } = options;
  const chat = useChat({
    ...chatOptions,
    transport: new DefaultChatTransport({ api, fetch: backend.primitives.fetch }),
  });
  function handleSubmit(event?: SyntheticEvent) {
    event?.preventDefault();
    if (!input.trim() || chat.status === "submitted" || chat.status === "streaming") return;
    void chat.sendMessage({ text: input });
    setInput("");
  }
  return {
    ...chat,
    input,
    setInput,
    handleSubmit,
    handleInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setInput(event.target.value),
    isLoading: chat.status === "submitted" || chat.status === "streaming",
  };
}

export function useStateUrl(key: string, initial: string) {
  const searchParams = useSearchParams();
  const [value, setValue] = useState<string>(initial);

  const keyValue = searchParams.get(key);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramValue = params.get(key);
    if (paramValue) setValue(paramValue);
  }, [key]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    if (value === initial) params.delete(key);
    window.history.replaceState({}, "", `?${params.toString()}`);
  }, [key, value]);

  useEffect(() => {
    if (keyValue) {
      setValue(keyValue);
    } else {
      setValue(initial);
    }
  }, [keyValue]);

  return [value, setValue] as const;
}
