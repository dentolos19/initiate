import { Hono } from "hono";

import { ELEVENLABS_AGENT_ID } from "#/lib/server/environment.js";
import { elevenlabs } from "#/lib/server/integrations/elevenlabs.js";

const aiAgent = new Hono();

aiAgent.post("/agent", async (c) => {
  const results = await elevenlabs.conversationalAi.agents.list();
  const agent = results.agents.find((agent) => agent.agentId === ELEVENLABS_AGENT_ID);
  // const agent = results.agents[0];

  if (!agent) {
    return c.json({ message: "No agent found." }, 404);
  }

  return c.json({
    id: agent.agentId,
  });
});

export default aiAgent;
