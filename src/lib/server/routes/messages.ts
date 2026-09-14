import { generateText } from "ai";
import { Hono } from "hono";
import z from "zod";

import { messageRoom, roomOrganizationParticipant, roomUserParticipant } from "#/lib/database/schema.js";
import { generationModel } from "#/lib/server/integrations/ai.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database } from "#/lib/server/integrations/database.js";
import { checkMembership, getOrganizationId } from "#/lib/server/lib/utils.js";

const messages = new Hono<{ Bindings: Env }>();

const roomRelations = {
  organizations: { with: { organization: true } },
  users: { with: { user: true } },
} as const;

async function createMessageRoom(userIds: string[], organizationId?: string) {
  const roomId = await database.transaction(async (tx) => {
    const [room] = await tx.insert(messageRoom).values({}).returning({ id: messageRoom.id });
    await tx.insert(roomUserParticipant).values(userIds.map((userId) => ({ roomId: room.id, userId })));
    if (organizationId) {
      await tx.insert(roomOrganizationParticipant).values({ organizationId, roomId: room.id });
    }
    return room.id;
  });

  return database.query.messageRoom.findFirst({ where: { id: roomId }, with: roomRelations });
}

// Update message (edit) route
messages.put("/:messageId", async (c) => {
  return c.json({ message: "This endpoint is not implemented yet." }, 501);
});

// Delete message route, soft delete
messages.delete("/:messageId", async (c) => {
  return c.json({ message: "This endpoint is not implemented yet." }, 501);
});

// Create a new chat room
messages.post("/rooms", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const body = await c.req.json();

  const { success, data } = z
    .object({
      userId: z.string().optional(),
      organizationId: z.string().optional(),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  if (!data.userId && !data.organizationId) {
    return c.json({ message: "At least one of user's or organization's ID must be provided." }, 400);
  }

  let room;

  if (data.userId && data.organizationId) {
    // Check for existing user-to-organization room
    room = await database.query.messageRoom.findFirst({
      where: {
        AND: [
          {
            users: { userId: data.userId },
          },
          {
            organizations: { organizationId: data.organizationId },
          },
        ],
      },
      with: {
        users: {
          with: {
            user: true,
          },
        },
        organizations: {
          with: {
            organization: true,
          },
        },
      },
    });

    if (!room) {
      // Create new user-to-organization room
      room = await createMessageRoom([data.userId], data.organizationId);
    }
  } else if (data.userId) {
    // Check for existing user-to-user room
    room = await database.query.messageRoom.findFirst({
      where: {
        AND: [
          {
            users: { userId: auth.userId },
          },
          {
            users: { userId: data.userId },
          },
          {
            organizations: false,
          },
        ],
      },
      with: {
        users: {
          with: {
            user: true,
          },
        },
        organizations: {
          with: {
            organization: true,
          },
        },
      },
    });

    if (!room) {
      // Create new user-to-user room
      room = await createMessageRoom([auth.userId, data.userId]);
    }
  } else if (data.organizationId) {
    // Check for existing user-to-organization room
    room = await database.query.messageRoom.findFirst({
      where: {
        AND: [
          {
            users: { userId: auth.userId },
          },
          {
            organizations: { organizationId: data.organizationId },
          },
        ],
      },
      with: {
        users: {
          with: {
            user: true,
          },
        },
        organizations: {
          with: {
            organization: true,
          },
        },
      },
    });

    if (!room) {
      // Create new user-to-organization room
      room = await createMessageRoom([auth.userId], data.organizationId);
    }
  }

  return c.json(room);
});

// Get all chat rooms
messages.get("/rooms", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const context = c.req.query("context");

  if (context === "organization") {
    const organizationId = getOrganizationId(c);

    if (!organizationId) {
      return c.json({ message: "Organization not found." }, 404);
    }

    const authorized = await checkMembership(auth.userId, organizationId);

    if (!authorized) {
      return c.json({ message: "You are not a member of this organization." }, 403);
    }

    const rooms = await database.query.messageRoom.findMany({
      where: {
        organizations: { organizationId },
      },
      with: {
        users: {
          with: {
            user: true,
          },
        },
        organizations: {
          with: {
            organization: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          limit: 1,
          with: {
            user: true,
          },
        },
      },
    });

    return c.json(rooms);
  } else {
    const rooms = await database.query.messageRoom.findMany({
      where: {
        users: { userId: auth.userId },
      },
      with: {
        users: {
          with: {
            user: true,
          },
        },
        organizations: {
          with: {
            organization: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          limit: 1,
          with: {
            user: true,
          },
        },
      },
    });

    return c.json(rooms);
  }
});

// Get all room participations
messages.get("/participations", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const context = c.req.query("context");

  if (context === "organization") {
    const organizationId = getOrganizationId(c);

    if (!organizationId) {
      return c.json({ message: "Organization not found." }, 404);
    }

    const authorized = await checkMembership(auth.userId, organizationId);

    if (!authorized) {
      return c.json({ message: "You are not a member of this organization." }, 403);
    }

    const participations = await database.query.roomOrganizationParticipant.findMany({
      where: {
        organizationId,
      },
      with: {
        room: {
          with: {
            users: {
              with: {
                user: true,
              },
            },
            organizations: {
              with: {
                organization: true,
              },
            },
          },
        },
      },
    });

    return c.json(participations);
  } else {
    const participations = await database.query.roomUserParticipant.findMany({
      where: {
        userId: auth.userId,
      },
      with: {
        room: {
          with: {
            users: {
              with: {
                user: true,
              },
            },
            organizations: {
              with: {
                organization: true,
              },
            },
          },
        },
      },
    });

    return c.json(participations);
  }
});

// Get a specific chat room
messages.get("/rooms/:roomId", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const roomId = c.req.param("roomId");

  const room = await database.query.messageRoom.findFirst({
    where: {
      id: roomId,
    },
    with: {
      users: {
        with: {
          user: true,
        },
      },
      organizations: {
        with: {
          organization: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        with: {
          user: true,
        },
      },
    },
  });

  if (!room) {
    return c.json({ message: "Room not found." }, 404);
  }

  // Check if user is a direct participant
  const isDirectParticipant = room.users.some((participant) => participant.userId === auth.userId);

  // Check if user is part of any organization that participates in this room
  let isOrganizationMember = false;
  if (room.organizations.length > 0) {
    for (const orgParticipant of room.organizations) {
      const isMember = await checkMembership(auth.userId, orgParticipant.organizationId);
      if (isMember) {
        isOrganizationMember = true;
        break;
      }
    }
  }

  if (!isDirectParticipant && !isOrganizationMember) {
    return c.json({ message: "You are not a participant in this room." }, 403);
  }

  return c.json(room);
});

// Enable communication via Durable Objects
messages.get("/rooms/:roomId/connect", async (c) => {
  const roomId = c.req.param("roomId");

  const room = await database.query.messageRoom.findFirst({
    where: {
      id: roomId,
    },
    columns: {
      id: true,
    },
  });

  if (!room) {
    return c.json({ message: "Room not found." }, 404);
  }

  const id = c.env.MESSENGER.idFromName(room.id);
  const stub = c.env.MESSENGER.get(id);
  return stub.fetch(c.req.raw);
});

// AI chat summary route
messages.post("/rooms/:roomId/summary", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const roomId = c.req.param("roomId");

  const room = await database.query.messageRoom.findFirst({
    where: {
      id: roomId,
    },
    with: {
      users: {
        with: {
          user: true,
        },
      },
      organizations: {
        with: {
          organization: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        limit: 50, // Limit to the latest 50 messages for summary
        with: {
          user: true,
        },
      },
    },
  });

  if (!room) {
    return c.json({ message: "Room not found." }, 404);
  }

  // Check if user is a direct participant
  const isDirectParticipant = room.users.some((participant) => participant.userId === auth.userId);

  // Check if user is part of any organization that participates in this room
  let isOrganizationMember = false;
  if (room.organizations.length > 0) {
    for (const orgParticipant of room.organizations) {
      const isMember = await checkMembership(auth.userId, orgParticipant.organizationId);
      if (isMember) {
        isOrganizationMember = true;
        break;
      }
    }
  }

  if (!isDirectParticipant && !isOrganizationMember) {
    return c.json({ message: "You are not a participant in this room." }, 403);
  }

  // Generate the conversation summary through OpenRouter.
  try {
    const messageContents = room.messages
      .map((msg) => `${msg.user?.firstName ?? "Unknown"} ${msg.user?.lastName ?? ""}: ${msg.content}`)
      .join("\n");

    if (!messageContents.trim()) {
      return c.json({ message: "No messages found to summarize." }, 400);
    }

    const { text } = await generateText({
      model: generationModel,
      prompt: `Please provide a concise summary of the following chat conversation. Focus on the main topics discussed, key decisions made, and important points raised:

${messageContents}

Please format the summary in a clear and organized manner.`,
    });

    return c.json({ summary: text }, 200);
  } catch (error) {
    console.error("Error generating summary:", error);
    return c.json({ message: "Failed to generate summary." }, 500);
  }
});

export default messages;
