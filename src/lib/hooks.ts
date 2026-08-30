import { useChat, UseChatOptions } from "@ai-sdk/react";
import { useEffect, useState } from "react";

import { BACKEND_URL } from "#/environment";
import useBackend from "#/lib/backend/client";
import { useSearchParams } from "#/lib/router";

export function useChatInternal(options?: UseChatOptions) {
  const backend = useBackend();
  return useChat({
    ...options,
    api: `${BACKEND_URL}/ai/chat`,
    fetch: backend.primitives.fetch,
    sendExtraMessageFields: true,
  });
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
