CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "CallMode" AS ENUM('VOICE', 'VIDEO');--> statement-breakpoint
CREATE TYPE "CallType" AS ENUM('MISSED', 'ACCEPTED');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"type" text DEFAULT 'application/octet-stream' NOT NULL,
	"hash" text,
	"size" integer DEFAULT 0 NOT NULL,
	"accessedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" text PRIMARY KEY,
	"issuer" text NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp(3),
	"refreshTokenExpiresAt" timestamp(3),
	"scope" text,
	"password" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_invitations" (
	"id" text PRIMARY KEY,
	"organizationId" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"inviterId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_members" (
	"id" text PRIMARY KEY,
	"organizationId" text NOT NULL,
	"userId" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY,
	"expiresAt" timestamp(3) NOT NULL,
	"token" text NOT NULL UNIQUE,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	"activeOrganizationId" text
);
--> statement-breakpoint
CREATE TABLE "auth_verifications" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "communication_calls" (
	"id" text PRIMARY KEY,
	"roomId" text NOT NULL,
	"messageRoomId" text,
	"initiatorId" text NOT NULL,
	"type" "CallType" DEFAULT 'MISSED'::"CallType" NOT NULL,
	"callType" "CallMode" NOT NULL,
	"endedAt" timestamp(3),
	"startedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_participants" (
	"id" text PRIMARY KEY,
	"callId" text NOT NULL,
	"userId" text NOT NULL,
	"leftAt" timestamp(3),
	"joinedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_comments" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"postId" text NOT NULL,
	"content" text NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"parentId" text
);
--> statement-breakpoint
CREATE TABLE "community_follows" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"tag" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_likes" (
	"userId" text,
	"postId" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "community_likes_pkey" PRIMARY KEY("userId","postId")
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"organizationId" text,
	"imageUrl" text,
	"bannerUrl" text,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"tags" text[],
	"embedding" vector(768),
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"budget" double precision,
	"deadline" timestamp(3),
	"type" text DEFAULT 'general' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_proposals" (
	"id" text PRIMARY KEY,
	"postId" text NOT NULL,
	"userId" text NOT NULL,
	"organizationId" text,
	"status" text DEFAULT 'proposal' NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"duration" integer,
	"cost" double precision,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication_messages" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"roomId" text NOT NULL,
	"content" text NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"attachments" jsonb DEFAULT '[]' NOT NULL,
	"isDeleted" boolean DEFAULT false NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication_rooms" (
	"id" text PRIMARY KEY
);
--> statement-breakpoint
CREATE TABLE "user_notifications" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"content" text,
	"url" text,
	"isRead" boolean DEFAULT false NOT NULL,
	"isArchived" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_orders" (
	"id" text PRIMARY KEY,
	"userId" text,
	"serviceId" text,
	"planId" text,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"dueAt" timestamp(3),
	"instructions" text,
	"name" text DEFAULT 'Order' NOT NULL,
	"organizationId" text
);
--> statement-breakpoint
CREATE TABLE "order_disputes" (
	"id" text PRIMARY KEY,
	"orderId" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"resolutionAt" timestamp(3),
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_invoices" (
	"id" text PRIMARY KEY,
	"userId" text,
	"orderId" text,
	"currency" text DEFAULT 'sgd' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"url" text,
	"stripeAccountId" text NOT NULL,
	"stripeCustomerId" text NOT NULL,
	"stripeInvoiceId" text NOT NULL,
	"dueAt" timestamp(3),
	"paidAt" timestamp(3),
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"description" text,
	"milestoneId" text
);
--> statement-breakpoint
CREATE TABLE "order_milestones" (
	"id" text PRIMARY KEY,
	"orderId" text NOT NULL,
	"name" text DEFAULT 'Milestone' NOT NULL,
	"content" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"dueAt" timestamp(3),
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text UNIQUE,
	"authMetadata" text,
	"description" text,
	"type" text DEFAULT 'startup' NOT NULL,
	"bannerUrl" text,
	"imageUrl" text,
	"tagline" text,
	"tags" text[],
	"embedding" vector(768),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"stripeAccountId" text,
	"location" text
);
--> statement-breakpoint
CREATE TABLE "organization_likes" (
	"userId" text,
	"organizationId" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "organization_likes_pkey" PRIMARY KEY("userId","organizationId")
);
--> statement-breakpoint
CREATE TABLE "organization_notifications" (
	"id" text PRIMARY KEY,
	"organizationId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content" text,
	"url" text,
	"isRead" boolean DEFAULT false NOT NULL,
	"isArchived" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_reviews" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"organizationId" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"stars" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_documentation" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_grant" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"location" text,
	"description" text,
	"grant" text,
	"criteria" text[],
	"process" text[],
	"websiteUrl" text,
	"applyUrl" text,
	"providerEmail" text,
	"providerPhone" text,
	"embedding" vector(768),
	"deadlineAt" timestamp(3),
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_participants" (
	"organizationId" text,
	"roomId" text,
	CONSTRAINT "organization_participants_pkey" PRIMARY KEY("organizationId","roomId")
);
--> statement-breakpoint
CREATE TABLE "user_participants" (
	"userId" text,
	"roomId" text,
	CONSTRAINT "user_participants_pkey" PRIMARY KEY("userId","roomId")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY,
	"organizationId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"bannerUrl" text,
	"imageUrl" text,
	"tagline" text,
	"tags" text[],
	"embedding" vector(768),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"type" text DEFAULT 'other' NOT NULL,
	"stripeProductId" text,
	"features" jsonb
);
--> statement-breakpoint
CREATE TABLE "service_likes" (
	"userId" text,
	"serviceId" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "service_likes_pkey" PRIMARY KEY("userId","serviceId")
);
--> statement-breakpoint
CREATE TABLE "service_plans" (
	"id" text PRIMARY KEY,
	"serviceId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"stripePriceData" jsonb,
	"stripePriceId" text,
	"default" boolean DEFAULT false NOT NULL,
	"deployment" jsonb,
	"features" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'sgd' NOT NULL,
	"type" text DEFAULT 'stripe' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_reviews" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"serviceId" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"stars" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"firstName" text NOT NULL,
	"lastName" text,
	"email" text UNIQUE,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"emails" text[],
	"type" text DEFAULT 'user' NOT NULL,
	"description" text,
	"bannerUrl" text,
	"imageUrl" text,
	"tagline" text,
	"embedding" vector(768),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"prompt" text,
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"location" text
);
--> statement-breakpoint
CREATE TABLE "user_chats" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"name" text DEFAULT 'Untitled Chat' NOT NULL,
	"messages" jsonb NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_follows" (
	"userId" text,
	"followId" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "user_follows_pkey" PRIMARY KEY("userId","followId")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "auth_accounts_issuer_accountId_key" ON "auth_accounts" ("issuer","accountId");--> statement-breakpoint
CREATE INDEX "authAccount_userId_idx" ON "auth_accounts" ("userId");--> statement-breakpoint
CREATE INDEX "authInvitation_organizationId_idx" ON "auth_invitations" ("organizationId");--> statement-breakpoint
CREATE INDEX "authInvitation_email_idx" ON "auth_invitations" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_members_organizationId_userId_key" ON "auth_members" ("organizationId","userId");--> statement-breakpoint
CREATE INDEX "authMember_userId_idx" ON "auth_members" ("userId");--> statement-breakpoint
CREATE INDEX "authSession_userId_idx" ON "auth_sessions" ("userId");--> statement-breakpoint
CREATE INDEX "authVerification_identifier_idx" ON "auth_verifications" ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "call_participants_callId_userId_key" ON "call_participants" ("callId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "community_follows_userId_tag_key" ON "community_follows" ("userId","tag");--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_invitations" ADD CONSTRAINT "auth_invitations_organizationId_organizations_id_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_invitations" ADD CONSTRAINT "auth_invitations_inviterId_users_id_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_members" ADD CONSTRAINT "auth_members_organizationId_organizations_id_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_members" ADD CONSTRAINT "auth_members_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_activeOrganizationId_organizations_id_fkey" FOREIGN KEY ("activeOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "communication_calls" ADD CONSTRAINT "communication_calls_messageRoomId_communication_rooms_id_fkey" FOREIGN KEY ("messageRoomId") REFERENCES "communication_rooms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "communication_calls" ADD CONSTRAINT "communication_calls_initiatorId_users_id_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "call_participants" ADD CONSTRAINT "call_participants_callId_communication_calls_id_fkey" FOREIGN KEY ("callId") REFERENCES "communication_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "call_participants" ADD CONSTRAINT "call_participants_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_postId_community_posts_id_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "community_follows" ADD CONSTRAINT "community_follows_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "community_likes" ADD CONSTRAINT "community_likes_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "community_likes" ADD CONSTRAINT "community_likes_postId_community_posts_id_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_organizationId_organizations_id_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "community_proposals" ADD CONSTRAINT "community_proposals_postId_community_posts_id_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "community_proposals" ADD CONSTRAINT "community_proposals_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "community_proposals" ADD CONSTRAINT "community_proposals_organizationId_organizations_id_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_roomId_communication_rooms_id_fkey" FOREIGN KEY ("roomId") REFERENCES "communication_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_serviceId_services_id_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_planId_service_plans_id_fkey" FOREIGN KEY ("planId") REFERENCES "service_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_organizationId_organizations_id_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "order_disputes" ADD CONSTRAINT "order_disputes_orderId_service_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "service_invoices" ADD CONSTRAINT "service_invoices_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "service_invoices" ADD CONSTRAINT "service_invoices_orderId_service_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "service_invoices" ADD CONSTRAINT "service_invoices_milestoneId_order_milestones_id_fkey" FOREIGN KEY ("milestoneId") REFERENCES "order_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "order_milestones" ADD CONSTRAINT "order_milestones_orderId_service_orders_id_fkey" FOREIGN KEY ("orderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_likes" ADD CONSTRAINT "organization_likes_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_likes" ADD CONSTRAINT "organization_likes_organizationId_organizations_id_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_notifications" ADD CONSTRAINT "organization_notifications_organizationId_organizations_id_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_reviews" ADD CONSTRAINT "organization_reviews_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_reviews" ADD CONSTRAINT "organization_reviews_organizationId_organizations_id_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_participants" ADD CONSTRAINT "organization_participants_organizationId_organizations_id_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_participants" ADD CONSTRAINT "organization_participants_roomId_communication_rooms_id_fkey" FOREIGN KEY ("roomId") REFERENCES "communication_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "user_participants" ADD CONSTRAINT "user_participants_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "user_participants" ADD CONSTRAINT "user_participants_roomId_communication_rooms_id_fkey" FOREIGN KEY ("roomId") REFERENCES "communication_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_organizationId_organizations_id_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "service_likes" ADD CONSTRAINT "service_likes_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "service_likes" ADD CONSTRAINT "service_likes_serviceId_services_id_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "service_plans" ADD CONSTRAINT "service_plans_serviceId_services_id_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_serviceId_services_id_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "user_chats" ADD CONSTRAINT "user_chats_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followId_users_id_fkey" FOREIGN KEY ("followId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
