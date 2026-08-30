import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { OPENROUTER_API_KEY, OPENROUTER_CHAT_MODEL, PLATFORM_URL } from "#/lib/server/environment.js";

const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": PLATFORM_URL,
    "X-OpenRouter-Title": "Initiate",
  },
});

const generationModel = openrouter(OPENROUTER_CHAT_MODEL);

export { generationModel, openrouter };
