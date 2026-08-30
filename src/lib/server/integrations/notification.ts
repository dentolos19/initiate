import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { notification } from "#/lib/database/schema.js";
import { EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME } from "#/lib/server/environment.js";
import type { AppContext, AppDatabase } from "#/lib/server/types.js";

export type NotificationMessage = {
  audience: string[];
  data: {
    title: string;
    description?: string;
    content?: string;
  };
};

type NotificationInput = Omit<NotificationMessage["data"], "content"> & { content?: string | ReactNode };

export async function deliverNotification(env: Env, database: AppDatabase, message: NotificationMessage) {
  const directUsers = await database.query.user.findMany({
    where: { id: { in: message.audience } },
  });
  const organizations = await database.query.organization.findMany({
    where: { id: { in: message.audience } },
    columns: { id: true },
  });
  const memberships = await database.query.authMember.findMany({
    where: { organizationId: { in: organizations.map((organization) => organization.id) } },
  });
  const memberUsers = memberships.length
    ? await database.query.user.findMany({ where: { id: { in: memberships.map((membership) => membership.userId) } } })
    : [];
  const recipients = [...new Map([...directUsers, ...memberUsers].map((user) => [user.id, user])).values()];

  if (recipients.length) {
    await database.insert(notification).values(
      recipients.map((user) => ({
        userId: user.id,
        title: message.data.title,
        description: message.data.description,
        content: message.data.content,
        type: "general",
      })),
    );
  }

  const emails = recipients
    .map((user) => user.email ?? user.emails?.[0])
    .filter((email): email is string => Boolean(email));

  await Promise.all(
    emails.map((email) =>
      env.EMAIL.send({
        from: { email: EMAIL_FROM_ADDRESS, name: EMAIL_FROM_NAME },
        to: email,
        subject: message.data.title,
        text: message.data.description ?? message.data.content ?? "",
        html: message.data.content,
      }),
    ),
  );
}

export function createNotificationClient(context: AppContext, database: AppDatabase) {
  const sendNotification = async (audience: string[], data: NotificationInput) => {
    await deliverNotification(context.env, database, {
      audience,
      data: {
        ...data,
        content: typeof data.content === "string" ? data.content : renderToString(data.content),
      },
    });
  };

  const queueNotification = async (audience: string[], data: NotificationInput) => {
    await context.env.NOTIFICATION_QUEUE.send({
      audience,
      data: {
        ...data,
        content: typeof data.content === "string" ? data.content : renderToString(data.content),
      },
    });
  };

  return {
    email: context.env.EMAIL,
    queue: context.env.NOTIFICATION_QUEUE,
    sendNotification,
    queueNotification,
  };
}
