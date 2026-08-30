import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  doublePrecision,
  vector,
  uniqueIndex,
  index,
  foreignKey,
  primaryKey,
} from "drizzle-orm/pg-core";

const id = () =>
  text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const callType = pgEnum("CallType", ["MISSED", "ACCEPTED"]);
export const callMode = pgEnum("CallMode", ["VOICE", "VIDEO"]);

export const asset = pgTable("assets", {
  id: id(),
  name: text().notNull(),
  type: text().default("application/octet-stream").notNull(),
  hash: text(),
  size: integer().default(0).notNull(),
  accessedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const callParticipant = pgTable(
  "call_participants",
  {
    id: id(),
    callId: text()
      .notNull()
      .references(() => call.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    leftAt: timestamp({ precision: 3 }),
    joinedAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("call_participants_callId_userId_key").using(
      "btree",
      table.callId.asc().nullsLast(),
      table.userId.asc().nullsLast(),
    ),
  ],
);

export const call = pgTable("communication_calls", {
  id: id(),
  roomId: text().notNull(),
  messageRoomId: text().references(() => messageRoom.id, { onDelete: "cascade" }),
  initiatorId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  type: callType().default("MISSED").notNull(),
  callType: callMode().notNull(),
  endedAt: timestamp({ precision: 3 }),
  startedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const message = pgTable("communication_messages", {
  id: id(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  roomId: text()
    .notNull()
    .references(() => messageRoom.id, { onDelete: "cascade", onUpdate: "cascade" }),
  content: text().notNull(),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  attachments: jsonb().default([]).notNull(),
  isDeleted: boolean().default(false).notNull(),
  isRead: boolean().default(false).notNull(),
});

export const messageRoom = pgTable("communication_rooms", {
  id: id(),
});

export const communityComment = pgTable(
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
    updatedAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
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

export const communityFollow = pgTable(
  "community_follows",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    tag: text().notNull(),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("community_follows_userId_tag_key").using(
      "btree",
      table.userId.asc().nullsLast(),
      table.tag.asc().nullsLast(),
    ),
  ],
);

export const communityLike = pgTable(
  "community_likes",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    postId: text()
      .notNull()
      .references(() => communityPost.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.postId], name: "community_likes_pkey" })],
);

export const communityPost = pgTable("community_posts", {
  id: id(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  organizationId: text().references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" }),
  imageUrl: text(),
  bannerUrl: text(),
  title: text().notNull(),
  content: text().notNull(),
  tags: text().array(),
  embedding: vector({ dimensions: 768 }),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  budget: doublePrecision(),
  deadline: timestamp({ precision: 3 }),
  type: text().default("general").notNull(),
});

export const communityProposal = pgTable("community_proposals", {
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
  cost: doublePrecision(),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const orderDispute = pgTable("order_disputes", {
  id: id(),
  orderId: text()
    .notNull()
    .references(() => order.id, { onDelete: "cascade", onUpdate: "cascade" }),
  title: text().notNull(),
  description: text().notNull(),
  status: text().default("open").notNull(),
  resolution: text(),
  resolutionAt: timestamp({ precision: 3 }),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const orderMilestone = pgTable("order_milestones", {
  id: id(),
  orderId: text()
    .notNull()
    .references(() => order.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text().default("Milestone").notNull(),
  content: text(),
  status: text().default("draft").notNull(),
  dueAt: timestamp({ precision: 3 }),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  description: text(),
});

export const organizationLike = pgTable(
  "organization_likes",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.organizationId], name: "organization_likes_pkey" })],
);

export const organizationNotification = pgTable("organization_notifications", {
  id: id(),
  organizationId: text()
    .notNull()
    .references(() => organization.id, { onDelete: "cascade", onUpdate: "cascade" }),
  title: text().notNull(),
  description: text(),
  content: text(),
  url: text(),
  isRead: boolean().default(false).notNull(),
  isArchived: boolean().default(false).notNull(),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const roomOrganizationParticipant = pgTable(
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

export const organizationReview = pgTable("organization_reviews", {
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
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const organization = pgTable("organizations", {
  id: id(),
  name: text().notNull(),
  slug: text().unique(),
  authMetadata: text(),
  description: text(),
  type: text().default("startup").notNull(),
  bannerUrl: text(),
  imageUrl: text(),
  tagline: text(),
  tags: text().array(),
  embedding: vector({ dimensions: 768 }),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  verified: boolean().default(false).notNull(),
  stripeAccountId: text(),
  location: text(),
});

export const resourceDocumentation = pgTable("resource_documentation", {
  id: id(),
  name: text().notNull(),
  description: text(),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const resourceGrant = pgTable("resource_grant", {
  id: id(),
  name: text().notNull(),
  provider: text().notNull(),
  location: text(),
  description: text(),
  grant: text(),
  criteria: text().array(),
  process: text().array(),
  websiteUrl: text(),
  applyUrl: text(),
  providerEmail: text(),
  providerPhone: text(),
  embedding: vector({ dimensions: 768 }),
  deadlineAt: timestamp({ precision: 3 }),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const orderInvoice = pgTable("service_invoices", {
  id: id(),
  userId: text().references(() => user.id, { onDelete: "set null", onUpdate: "cascade" }),
  orderId: text().references(() => order.id, { onDelete: "set null", onUpdate: "cascade" }),
  currency: text().default("sgd").notNull(),
  amount: integer().default(0).notNull(),
  status: text().default("draft").notNull(),
  url: text(),
  stripeAccountId: text().notNull(),
  stripeCustomerId: text().notNull(),
  stripeInvoiceId: text().notNull(),
  dueAt: timestamp({ precision: 3 }),
  paidAt: timestamp({ precision: 3 }),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  description: text(),
  milestoneId: text().references(() => orderMilestone.id, { onDelete: "set null", onUpdate: "cascade" }),
});

export const serviceLike = pgTable(
  "service_likes",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    serviceId: text()
      .notNull()
      .references(() => service.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.serviceId], name: "service_likes_pkey" })],
);

export const order = pgTable("service_orders", {
  id: id(),
  userId: text().references(() => user.id, { onDelete: "set null", onUpdate: "cascade" }),
  serviceId: text().references(() => service.id, { onDelete: "set null", onUpdate: "cascade" }),
  planId: text().references(() => servicePlan.id, { onDelete: "set null", onUpdate: "cascade" }),
  description: text(),
  status: text().default("pending").notNull(),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  dueAt: timestamp({ precision: 3 }),
  instructions: text(),
  name: text().default("Order").notNull(),
  organizationId: text().references(() => organization.id, { onDelete: "set null", onUpdate: "cascade" }),
});

export const servicePlan = pgTable("service_plans", {
  id: id(),
  serviceId: text()
    .notNull()
    .references(() => service.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text().notNull(),
  description: text(),
  stripePriceData: jsonb(),
  stripePriceId: text(),
  default: boolean().default(false).notNull(),
  deployment: jsonb(),
  features: jsonb(),
  status: text().default("active").notNull(),
  amount: integer().default(0).notNull(),
  currency: text().default("sgd").notNull(),
  type: text().default("stripe").notNull(),
});

export const serviceReview = pgTable("service_reviews", {
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
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const service = pgTable("services", {
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
  tags: text().array(),
  embedding: vector({ dimensions: 768 }),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  type: text().default("other").notNull(),
  stripeProductId: text(),
  features: jsonb(),
});

export const userChat = pgTable("user_chats", {
  id: id(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text().default("Untitled Chat").notNull(),
  messages: jsonb().notNull(),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const userFollow = pgTable(
  "user_follows",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    followId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.followId], name: "user_follows_pkey" })],
);

export const notification = pgTable("user_notifications", {
  id: id(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  title: text().notNull(),
  type: text().notNull(),
  description: text(),
  content: text(),
  url: text(),
  isRead: boolean().default(false).notNull(),
  isArchived: boolean().default(false).notNull(),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const roomUserParticipant = pgTable(
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

export const user = pgTable("users", {
  id: id(),
  firstName: text().notNull(),
  lastName: text(),
  email: text().unique(),
  emailVerified: boolean().default(false).notNull(),
  emails: text().array(),
  type: text().default("user").notNull(),
  description: text(),
  bannerUrl: text(),
  imageUrl: text(),
  tagline: text(),
  embedding: vector({ dimensions: 768 }),
  createdAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3 })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  prompt: text(),
  settings: jsonb().default({}).notNull(),
  location: text(),
});

export const authSession = pgTable(
  "auth_sessions",
  {
    id: id(),
    expiresAt: timestamp({ precision: 3 }).notNull(),
    token: text().notNull().unique(),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
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

export const authAccount = pgTable(
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
    accessTokenExpiresAt: timestamp({ precision: 3 }),
    refreshTokenExpiresAt: timestamp({ precision: 3 }),
    scope: text(),
    password: text(),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("auth_accounts_issuer_accountId_key").using("btree", table.issuer, table.accountId),
    index("authAccount_userId_idx").on(table.userId),
  ],
);

export const authVerification = pgTable(
  "auth_verifications",
  {
    id: id(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ precision: 3 }).notNull(),
    createdAt: timestamp({ precision: 3 }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp({ precision: 3 }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("authVerification_identifier_idx").on(table.identifier)],
);

export const authMember = pgTable(
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
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("auth_members_organizationId_userId_key").using("btree", table.organizationId, table.userId),
    index("authMember_userId_idx").on(table.userId),
  ],
);

export const authInvitation = pgTable(
  "auth_invitations",
  {
    id: id(),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text().notNull(),
    role: text(),
    status: text().default("pending").notNull(),
    expiresAt: timestamp({ precision: 3 }).notNull(),
    inviterId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp({ precision: 3 })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("authInvitation_organizationId_idx").on(table.organizationId),
    index("authInvitation_email_idx").on(table.email),
  ],
);
