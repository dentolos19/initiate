import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import {
  OPENROUTER_API_KEY,
  OPENROUTER_MODEL,
  OPENROUTER_REFERER,
  OPENROUTER_TITLE,
} from "#/lib/server/environment.js";

const attributionHeaders = {
  "HTTP-Referer": OPENROUTER_REFERER,
  "X-OpenRouter-Title": OPENROUTER_TITLE,
};

const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY,
  headers: attributionHeaders,
});

const generationModel = openrouter(OPENROUTER_MODEL);

export { attributionHeaders, generationModel, openrouter };
