import { sql } from "drizzle-orm";
import { foreignKey, index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () =>
  text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const callMode = ["VOICE", "VIDEO"] as const;
export const callType = ["MISSED", "ACCEPTED"] as const;

export const asset = sqliteTable("assets", {
  id: id(),
  name: text().notNull(),
  type: text().default("application/octet-stream").notNull(),
  hash: text(),
  size: integer().default(0).notNull(),
  accessedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const callParticipant = sqliteTable(
  "call_participants",
  {
    id: id(),
    callId: text()
      .notNull()
      .references(() => call.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    leftAt: integer({ mode: "timestamp_ms" }),
    joinedAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [uniqueIndex("call_participants_callId_userId_key").on(table.callId, table.userId)],
);

export const call = sqliteTable("communication_calls", {
  id: id(),
  roomId: text().notNull(),
  messageRoomId: text().references(() => messageRoom.id, { onDelete: "cascade" }),
  initiatorId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  type: text({ enum: callType }).default("MISSED").notNull(),
  callType: text({ enum: callMode }).notNull(),
  endedAt: integer({ mode: "timestamp_ms" }),
  startedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const message = sqliteTable("communication_messages", {
  id: id(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  roomId: text()
    .notNull()
    .references(() => messageRoom.id, { onDelete: "cascade", onUpdate: "cascade" }),
  content: text().notNull(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  attachments: text({ mode: "json" }).$type<any[]>().default([]).notNull(),
  isDeleted: integer({ mode: "boolean" }).default(false).notNull(),
  isRead: integer({ mode: "boolean" }).default(false).notNull(),
});

export const messageRoom = sqliteTable("communication_rooms", {
  id: id(),
});

export const communityComment = sqliteTable(
  "community_comments",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    postId: text()
      .notNull()
      .references(() => communityPost.id, { onDelete: "cascade", onUpdate: "cascade" }),
    content: text().notNull(),
    updatedAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    createdAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    parentId: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "community_comments_parentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const communityFollow = sqliteTable(
  "community_follows",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    tag: text().notNull(),
    createdAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [uniqueIndex("community_follows_userId_tag_key").on(table.userId, table.tag)],
);

export const communityLike = sqliteTable(
  "community_likes",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    postId: text()
      .notNull()
      .references(() => communityPost.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.postId], name: "community_likes_pkey" })],
);

export const communityPost = sqliteTable("community_posts", {
  id: id(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  organizationId: text().references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" }),
  imageUrl: text(),
  bannerUrl: text(),
  title: text().notNull(),
  content: text().notNull(),
  tags: text({ mode: "json" }).$type<string[]>(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  budget: real(),
  deadline: integer({ mode: "timestamp_ms" }),
  type: text().default("general").notNull(),
});

export const communityProposal = sqliteTable("community_proposals", {
  id: id(),
  postId: text()
    .notNull()
    .references(() => communityPost.id, { onDelete: "cascade", onUpdate: "cascade" }),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  organizationId: text().references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" }),
  status: text().default("proposal").notNull(),
  title: text().notNull(),
  content: text().notNull(),
  duration: integer(),
  cost: real(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const orderDispute = sqliteTable("order_disputes", {
  id: id(),
  orderId: text()
    .notNull()
    .references(() => order.id, { onDelete: "cascade", onUpdate: "cascade" }),
  title: text().notNull(),
  description: text().notNull(),
  status: text().default("open").notNull(),
  resolution: text(),
  resolutionAt: integer({ mode: "timestamp_ms" }),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const orderMilestone = sqliteTable("order_milestones", {
  id: id(),
  orderId: text()
    .notNull()
    .references(() => order.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text().default("Milestone").notNull(),
  content: text(),
  status: text().default("draft").notNull(),
  dueAt: integer({ mode: "timestamp_ms" }),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  description: text(),
});

export const organizationLike = sqliteTable(
  "organization_likes",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.organizationId], name: "organization_likes_pkey" })],
);

export const organizationNotification = sqliteTable("organization_notifications", {
  id: id(),
  organizationId: text()
    .notNull()
    .references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" }),
  title: text().notNull(),
  description: text(),
  content: text(),
  url: text(),
  isRead: integer({ mode: "boolean" }).default(false).notNull(),
  isArchived: integer({ mode: "boolean" }).default(false).notNull(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const roomOrganizationParticipant = sqliteTable(
  "organization_participants",
  {
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" }),
    roomId: text()
      .notNull()
      .references(() => messageRoom.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.roomId], name: "organization_participants_pkey" })],
);

export const organizationReview = sqliteTable("organization_reviews", {
  id: id(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  organizationId: text()
    .notNull()
    .references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" }),
  title: text().notNull(),
  message: text().notNull(),
  stars: integer().notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const organization = sqliteTable("organizations", {
  id: id(),
  name: text().notNull(),
  slug: text().unique(),
  authMetadata: text(),
  description: text(),
  type: text().default("startup").notNull(),
  bannerUrl: text(),
  imageUrl: text(),
  tagline: text(),
  tags: text({ mode: "json" }).$type<string[]>(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  verified: integer({ mode: "boolean" }).default(false).notNull(),
  paymentAccountId: text(),
  location: text(),
});

export const resourceDocumentation = sqliteTable("resource_documentation", {
  id: id(),
  name: text().notNull(),
  description: text(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const resourceGrant = sqliteTable("resource_grant", {
  id: id(),
  name: text().notNull(),
  provider: text().notNull(),
  location: text(),
  description: text(),
  grant: text(),
  criteria: text({ mode: "json" }).$type<string[]>(),
  process: text({ mode: "json" }).$type<string[]>(),
  websiteUrl: text(),
  applyUrl: text(),
  providerEmail: text(),
  providerPhone: text(),
  deadlineAt: integer({ mode: "timestamp_ms" }),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const orderInvoice = sqliteTable("service_invoices", {
  id: id(),
  userId: text().references(() => user.id, { onDelete: "set null", onUpdate: "cascade" }),
  orderId: text().references(() => order.id, { onDelete: "set null", onUpdate: "cascade" }),
  currency: text().default("sgd").notNull(),
  amount: integer().default(0).notNull(),
  status: text().default("draft").notNull(),
  url: text(),
  paymentAccountId: text().notNull(),
  customerReference: text().notNull(),
  reference: text().notNull(),
  dueAt: integer({ mode: "timestamp_ms" }),
  paidAt: integer({ mode: "timestamp_ms" }),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  description: text(),
  milestoneId: text().references(() => orderMilestone.id, { onDelete: "set null", onUpdate: "cascade" }),
});

export const serviceLike = sqliteTable(
  "service_likes",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    serviceId: text()
      .notNull()
      .references(() => service.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.serviceId], name: "service_likes_pkey" })],
);

export const order = sqliteTable("service_orders", {
  id: id(),
  userId: text().references(() => user.id, { onDelete: "set null", onUpdate: "cascade" }),
  serviceId: text().references(() => service.id, { onDelete: "set null", onUpdate: "cascade" }),
  planId: text().references(() => servicePlan.id, { onDelete: "set null", onUpdate: "cascade" }),
  description: text(),
  status: text().default("pending").notNull(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  dueAt: integer({ mode: "timestamp_ms" }),
  instructions: text(),
  name: text().default("Order").notNull(),
  organizationId: text().references(() => organization.id, { onDelete: "set null", onUpdate: "cascade" }),
});

export const servicePlan = sqliteTable("service_plans", {
  id: id(),
  serviceId: text()
    .notNull()
    .references(() => service.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text().notNull(),
  description: text(),
  priceData: text({ mode: "json" }).$type<Record<string, any>>(),
  priceReference: text(),
  default: integer({ mode: "boolean" }).default(false).notNull(),
  deployment: text({ mode: "json" }).$type<Record<string, any>>(),
  features: text({ mode: "json" }).$type<any[]>(),
  status: text().default("active").notNull(),
  amount: integer().default(0).notNull(),
  currency: text().default("sgd").notNull(),
  type: text().default("one_time").notNull(),
});

export const serviceReview = sqliteTable("service_reviews", {
  id: id(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  serviceId: text()
    .notNull()
    .references(() => service.id, { onDelete: "cascade", onUpdate: "cascade" }),
  title: text().notNull(),
  message: text().notNull(),
  stars: integer().notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const service = sqliteTable("services", {
  id: id(),
  organizationId: text()
    .notNull()
    .references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text().notNull(),
  description: text(),
  status: text().default("draft").notNull(),
  bannerUrl: text(),
  imageUrl: text(),
  tagline: text(),
  tags: text({ mode: "json" }).$type<string[]>(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  type: text().default("other").notNull(),
  productReference: text(),
  features: text({ mode: "json" }).$type<any[]>(),
});

export const userChat = sqliteTable("user_chats", {
  id: id(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text().default("Untitled Chat").notNull(),
  messages: text({ mode: "json" }).$type<any[]>().notNull(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const userFollow = sqliteTable(
  "user_follows",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    followId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.followId], name: "user_follows_pkey" })],
);

export const notification = sqliteTable("user_notifications", {
  id: id(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  title: text().notNull(),
  type: text().notNull(),
  description: text(),
  content: text(),
  url: text(),
  isRead: integer({ mode: "boolean" }).default(false).notNull(),
  isArchived: integer({ mode: "boolean" }).default(false).notNull(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
});

export const roomUserParticipant = sqliteTable(
  "user_participants",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    roomId: text()
      .notNull()
      .references(() => messageRoom.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roomId], name: "user_participants_pkey" })],
);

export const user = sqliteTable("users", {
  id: id(),
  firstName: text().notNull(),
  lastName: text(),
  email: text().unique(),
  emailVerified: integer({ mode: "boolean" }).default(false).notNull(),
  emails: text({ mode: "json" }).$type<string[]>(),
  type: text().default("user").notNull(),
  description: text(),
  bannerUrl: text(),
  imageUrl: text(),
  tagline: text(),
  createdAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  updatedAt: integer({ mode: "timestamp_ms" })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  prompt: text(),
  settings: text({ mode: "json" }).$type<Record<string, any>>().default({}).notNull(),
  location: text(),
});

export const authSession = sqliteTable(
  "auth_sessions",
  {
    id: id(),
    expiresAt: integer({ mode: "timestamp_ms" }).notNull(),
    token: text().notNull().unique(),
    createdAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text().references(() => organization.id, { onDelete: "set null" }),
  },
  (table) => [index("authSession_userId_idx").on(table.userId)],
);

export const authAccount = sqliteTable(
  "auth_accounts",
  {
    id: id(),
    issuer: text().notNull(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: integer({ mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer({ mode: "timestamp_ms" }),
    scope: text(),
    password: text(),
    createdAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("auth_accounts_issuer_accountId_key").on(table.issuer, table.accountId),
    index("authAccount_userId_idx").on(table.userId),
  ],
);

export const authVerification = sqliteTable(
  "auth_verifications",
  {
    id: id(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: integer({ mode: "timestamp_ms" }).notNull(),
    createdAt: integer({ mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
    updatedAt: integer({ mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  },
  (table) => [index("authVerification_identifier_idx").on(table.identifier)],
);

export const authMember = sqliteTable(
  "auth_members",
  {
    id: id(),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text().default("member").notNull(),
    createdAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("auth_members_organizationId_userId_key").on(table.organizationId, table.userId),
    index("authMember_userId_idx").on(table.userId),
  ],
);

export const authInvitation = sqliteTable(
  "auth_invitations",
  {
    id: id(),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text().notNull(),
    role: text(),
    status: text().default("pending").notNull(),
    expiresAt: integer({ mode: "timestamp_ms" }).notNull(),
    inviterId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer({ mode: "timestamp_ms" })
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [
    index("authInvitation_organizationId_idx").on(table.organizationId),
    index("authInvitation_email_idx").on(table.email),
  ],
);
