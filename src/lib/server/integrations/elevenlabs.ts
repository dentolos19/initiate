import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

import { ELEVENLABS_API_KEY } from "#/lib/server/environment.js";

const elevenlabs = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

export { elevenlabs };
