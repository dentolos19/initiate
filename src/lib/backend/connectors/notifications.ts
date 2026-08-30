import z from "zod";

import { BackendPrimitives } from "#/lib/backend/primitives";

const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  content: z.string().nullish(),
  url: z.string().nullish(),
  isRead: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  createdAt: z.string().datetime(),
});

const userNotificationSchema = notificationSchema.extend({
  userId: z.string(),
});

const organizationNotificationSchema = notificationSchema.extend({
  organizationId: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;
export type UserNotification = z.infer<typeof userNotificationSchema>;
export type OrganizationNotification = z.infer<typeof organizationNotificationSchema>;

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    getUserNotifications: async (filter?: string): Promise<UserNotification[]> => {
      const params = new URLSearchParams();
      params.append("context", "user");
      if (filter) params.append("filter", filter);
      const response = await primitives.get(`/notifications?${params}`);
      return z.array(userNotificationSchema).parse(response);
    },

    getOrganizationNotifications: async (filter?: string): Promise<OrganizationNotification[]> => {
      const params = new URLSearchParams();
      params.append("context", "organization");
      if (filter) params.append("filter", filter);
      const response = await primitives.get(`/notifications?${params}`);
      return z.array(organizationNotificationSchema).parse(response);
    },

    archiveUserNotification: async (notificationId: string): Promise<void> => {
      const params = new URLSearchParams();
      params.append("context", "user");
      await primitives.patch(`/notifications/${notificationId}/archive?${params}`);
    },

    archiveOrganizationNotification: async (notificationId: string): Promise<void> => {
      const params = new URLSearchParams();
      params.append("context", "organization");
      await primitives.patch(`/notifications/${notificationId}/archive?${params}`);
    },

    unarchiveUserNotification: async (notificationId: string): Promise<void> => {
      const params = new URLSearchParams();
      params.append("context", "user");
      await primitives.patch(`/notifications/${notificationId}/unarchive?${params}`);
    },

    unarchiveOrganizationNotification: async (notificationId: string): Promise<void> => {
      const params = new URLSearchParams();
      params.append("context", "organization");
      await primitives.patch(`/notifications/${notificationId}/unarchive?${params}`);
    },
  };
}
