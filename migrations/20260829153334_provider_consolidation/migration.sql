CREATE TABLE "auth_accounts" (
	"id" text PRIMARY KEY,
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
ALTER TABLE "communication_calls" RENAME CONSTRAINT "communication_calls_initiatorId_fkey" TO "communication_calls_initiatorId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "call_participants" RENAME CONSTRAINT "call_participants_callId_fkey" TO "call_participants_callId_communication_calls_id_fkey";--> statement-breakpoint
ALTER TABLE "call_participants" RENAME CONSTRAINT "call_participants_userId_fkey" TO "call_participants_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "community_comments" RENAME CONSTRAINT "community_comments_userId_fkey" TO "community_comments_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "community_comments" RENAME CONSTRAINT "community_comments_postId_fkey" TO "community_comments_postId_community_posts_id_fkey";--> statement-breakpoint
ALTER TABLE "community_follows" RENAME CONSTRAINT "community_follows_userId_fkey" TO "community_follows_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "community_likes" RENAME CONSTRAINT "community_likes_userId_fkey" TO "community_likes_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "community_likes" RENAME CONSTRAINT "community_likes_postId_fkey" TO "community_likes_postId_community_posts_id_fkey";--> statement-breakpoint
ALTER TABLE "community_posts" RENAME CONSTRAINT "community_posts_userId_fkey" TO "community_posts_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "community_posts" RENAME CONSTRAINT "community_posts_organizationId_fkey" TO "community_posts_organizationId_organizations_id_fkey";--> statement-breakpoint
ALTER TABLE "community_proposals" RENAME CONSTRAINT "community_proposals_postId_fkey" TO "community_proposals_postId_community_posts_id_fkey";--> statement-breakpoint
ALTER TABLE "community_proposals" RENAME CONSTRAINT "community_proposals_userId_fkey" TO "community_proposals_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "community_proposals" RENAME CONSTRAINT "community_proposals_organizationId_fkey" TO "community_proposals_organizationId_organizations_id_fkey";--> statement-breakpoint
ALTER TABLE "communication_messages" RENAME CONSTRAINT "communication_messages_userId_fkey" TO "communication_messages_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "communication_messages" RENAME CONSTRAINT "communication_messages_roomId_fkey" TO "communication_messages_roomId_communication_rooms_id_fkey";--> statement-breakpoint
ALTER TABLE "user_notifications" RENAME CONSTRAINT "user_notifications_userId_fkey" TO "user_notifications_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "service_orders" RENAME CONSTRAINT "service_orders_userId_fkey" TO "service_orders_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "service_orders" RENAME CONSTRAINT "service_orders_serviceId_fkey" TO "service_orders_serviceId_services_id_fkey";--> statement-breakpoint
ALTER TABLE "service_orders" RENAME CONSTRAINT "service_orders_planId_fkey" TO "service_orders_planId_service_plans_id_fkey";--> statement-breakpoint
ALTER TABLE "service_orders" RENAME CONSTRAINT "service_orders_organizationId_fkey" TO "service_orders_organizationId_organizations_id_fkey";--> statement-breakpoint
ALTER TABLE "order_disputes" RENAME CONSTRAINT "order_disputes_orderId_fkey" TO "order_disputes_orderId_service_orders_id_fkey";--> statement-breakpoint
ALTER TABLE "service_invoices" RENAME CONSTRAINT "service_invoices_userId_fkey" TO "service_invoices_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "service_invoices" RENAME CONSTRAINT "service_invoices_orderId_fkey" TO "service_invoices_orderId_service_orders_id_fkey";--> statement-breakpoint
ALTER TABLE "service_invoices" RENAME CONSTRAINT "service_invoices_milestoneId_fkey" TO "service_invoices_milestoneId_order_milestones_id_fkey";--> statement-breakpoint
ALTER TABLE "order_milestones" RENAME CONSTRAINT "order_milestones_orderId_fkey" TO "order_milestones_orderId_service_orders_id_fkey";--> statement-breakpoint
ALTER TABLE "organization_likes" RENAME CONSTRAINT "organization_likes_userId_fkey" TO "organization_likes_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "organization_likes" RENAME CONSTRAINT "organization_likes_organizationId_fkey" TO "organization_likes_organizationId_organizations_id_fkey";--> statement-breakpoint
ALTER TABLE "organization_notifications" RENAME CONSTRAINT "organization_notifications_organizationId_fkey" TO "organization_notifications_organizationId_organizations_id_fkey";--> statement-breakpoint
ALTER TABLE "organization_reviews" RENAME CONSTRAINT "organization_reviews_userId_fkey" TO "organization_reviews_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "organization_reviews" RENAME CONSTRAINT "organization_reviews_organizationId_fkey" TO "organization_reviews_organizationId_organizations_id_fkey";--> statement-breakpoint
ALTER TABLE "organization_participants" RENAME CONSTRAINT "organization_participants_organizationId_fkey" TO "organization_participants_organizationId_organizations_id_fkey";--> statement-breakpoint
ALTER TABLE "organization_participants" RENAME CONSTRAINT "organization_participants_roomId_fkey" TO "organization_participants_roomId_communication_rooms_id_fkey";--> statement-breakpoint
ALTER TABLE "user_participants" RENAME CONSTRAINT "user_participants_userId_fkey" TO "user_participants_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "user_participants" RENAME CONSTRAINT "user_participants_roomId_fkey" TO "user_participants_roomId_communication_rooms_id_fkey";--> statement-breakpoint
ALTER TABLE "services" RENAME CONSTRAINT "services_organizationId_fkey" TO "services_organizationId_organizations_id_fkey";--> statement-breakpoint
ALTER TABLE "service_likes" RENAME CONSTRAINT "service_likes_userId_fkey" TO "service_likes_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "service_likes" RENAME CONSTRAINT "service_likes_serviceId_fkey" TO "service_likes_serviceId_services_id_fkey";--> statement-breakpoint
ALTER TABLE "service_plans" RENAME CONSTRAINT "service_plans_serviceId_fkey" TO "service_plans_serviceId_services_id_fkey";--> statement-breakpoint
ALTER TABLE "service_reviews" RENAME CONSTRAINT "service_reviews_userId_fkey" TO "service_reviews_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "service_reviews" RENAME CONSTRAINT "service_reviews_serviceId_fkey" TO "service_reviews_serviceId_services_id_fkey";--> statement-breakpoint
ALTER TABLE "user_chats" RENAME CONSTRAINT "user_chats_userId_fkey" TO "user_chats_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "user_follows" RENAME CONSTRAINT "user_follows_userId_fkey" TO "user_follows_userId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "user_follows" RENAME CONSTRAINT "user_follows_followId_fkey" TO "user_follows_followId_users_id_fkey";--> statement-breakpoint
ALTER TABLE "communication_calls" ADD COLUMN "messageRoomId" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "authMetadata" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailVerified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_slug_key" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE("email");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_members_organizationId_userId_key" ON "auth_members" ("organizationId","userId");--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_invitations" ADD CONSTRAINT "auth_invitations_organizationId_organizations_id_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_invitations" ADD CONSTRAINT "auth_invitations_inviterId_users_id_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_members" ADD CONSTRAINT "auth_members_organizationId_organizations_id_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_members" ADD CONSTRAINT "auth_members_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_activeOrganizationId_organizations_id_fkey" FOREIGN KEY ("activeOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "communication_calls" ADD CONSTRAINT "communication_calls_messageRoomId_communication_rooms_id_fkey" FOREIGN KEY ("messageRoomId") REFERENCES "communication_rooms"("id") ON DELETE CASCADE;