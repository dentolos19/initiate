CREATE TABLE `assets` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`type` text DEFAULT 'application/octet-stream' NOT NULL,
	`hash` text,
	`size` integer DEFAULT 0 NOT NULL,
	`accessedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_accounts` (
	`id` text PRIMARY KEY,
	`issuer` text NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_auth_accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `auth_invitations` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expiresAt` integer NOT NULL,
	`inviterId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_auth_invitations_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_auth_invitations_inviterId_users_id_fk` FOREIGN KEY (`inviterId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `auth_members` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_auth_members_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_auth_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	`activeOrganizationId` text,
	CONSTRAINT `fk_auth_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_auth_sessions_activeOrganizationId_organizations_id_fk` FOREIGN KEY (`activeOrganizationId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `auth_verifications` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000),
	`updatedAt` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `communication_calls` (
	`id` text PRIMARY KEY,
	`roomId` text NOT NULL,
	`messageRoomId` text,
	`initiatorId` text NOT NULL,
	`type` text DEFAULT 'MISSED' NOT NULL,
	`callType` text NOT NULL,
	`endedAt` integer,
	`startedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_communication_calls_messageRoomId_communication_rooms_id_fk` FOREIGN KEY (`messageRoomId`) REFERENCES `communication_rooms`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_communication_calls_initiatorId_users_id_fk` FOREIGN KEY (`initiatorId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `call_participants` (
	`id` text PRIMARY KEY,
	`callId` text NOT NULL,
	`userId` text NOT NULL,
	`leftAt` integer,
	`joinedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_call_participants_callId_communication_calls_id_fk` FOREIGN KEY (`callId`) REFERENCES `communication_calls`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_call_participants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `community_comments` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`postId` text NOT NULL,
	`content` text NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`parentId` text,
	CONSTRAINT `fk_community_comments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_community_comments_postId_community_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `community_posts`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `community_comments_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `community_comments`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `community_follows` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`tag` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_community_follows_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `community_likes` (
	`userId` text NOT NULL,
	`postId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `community_likes_pkey` PRIMARY KEY(`userId`, `postId`),
	CONSTRAINT `fk_community_likes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_community_likes_postId_community_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `community_posts`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`organizationId` text,
	`imageUrl` text,
	`bannerUrl` text,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`tags` text,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`budget` real,
	`deadline` integer,
	`type` text DEFAULT 'general' NOT NULL,
	CONSTRAINT `fk_community_posts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_community_posts_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `community_proposals` (
	`id` text PRIMARY KEY,
	`postId` text NOT NULL,
	`userId` text NOT NULL,
	`organizationId` text,
	`status` text DEFAULT 'proposal' NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`duration` integer,
	`cost` real,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_community_proposals_postId_community_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `community_posts`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_community_proposals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_community_proposals_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `communication_messages` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`roomId` text NOT NULL,
	`content` text NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`attachments` text DEFAULT '[]' NOT NULL,
	`isDeleted` integer DEFAULT false NOT NULL,
	`isRead` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_communication_messages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_communication_messages_roomId_communication_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `communication_rooms`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `communication_rooms` (
	`id` text PRIMARY KEY
);
--> statement-breakpoint
CREATE TABLE `user_notifications` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`content` text,
	`url` text,
	`isRead` integer DEFAULT false NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_user_notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `service_orders` (
	`id` text PRIMARY KEY,
	`userId` text,
	`serviceId` text,
	`planId` text,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`dueAt` integer,
	`instructions` text,
	`name` text DEFAULT 'Order' NOT NULL,
	`organizationId` text,
	CONSTRAINT `fk_service_orders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT `fk_service_orders_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT `fk_service_orders_planId_service_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `service_plans`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT `fk_service_orders_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `order_disputes` (
	`id` text PRIMARY KEY,
	`orderId` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolution` text,
	`resolutionAt` integer,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_order_disputes_orderId_service_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `service_orders`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `service_invoices` (
	`id` text PRIMARY KEY,
	`userId` text,
	`orderId` text,
	`currency` text DEFAULT 'sgd' NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`url` text,
	`stripeAccountId` text NOT NULL,
	`stripeCustomerId` text NOT NULL,
	`stripeInvoiceId` text NOT NULL,
	`dueAt` integer,
	`paidAt` integer,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`description` text,
	`milestoneId` text,
	CONSTRAINT `fk_service_invoices_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT `fk_service_invoices_orderId_service_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `service_orders`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
	CONSTRAINT `fk_service_invoices_milestoneId_order_milestones_id_fk` FOREIGN KEY (`milestoneId`) REFERENCES `order_milestones`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `order_milestones` (
	`id` text PRIMARY KEY,
	`orderId` text NOT NULL,
	`name` text DEFAULT 'Milestone' NOT NULL,
	`content` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`dueAt` integer,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`description` text,
	CONSTRAINT `fk_order_milestones_orderId_service_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `service_orders`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`slug` text UNIQUE,
	`authMetadata` text,
	`description` text,
	`type` text DEFAULT 'startup' NOT NULL,
	`bannerUrl` text,
	`imageUrl` text,
	`tagline` text,
	`tags` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`stripeAccountId` text,
	`location` text
);
--> statement-breakpoint
CREATE TABLE `organization_likes` (
	`userId` text NOT NULL,
	`organizationId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `organization_likes_pkey` PRIMARY KEY(`userId`, `organizationId`),
	CONSTRAINT `fk_organization_likes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_organization_likes_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `organization_notifications` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`content` text,
	`url` text,
	`isRead` integer DEFAULT false NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_organization_notifications_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `organization_reviews` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`organizationId` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`stars` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_organization_reviews_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_organization_reviews_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `resource_documentation` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `resource_grant` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`provider` text NOT NULL,
	`location` text,
	`description` text,
	`grant` text,
	`criteria` text,
	`process` text,
	`websiteUrl` text,
	`applyUrl` text,
	`providerEmail` text,
	`providerPhone` text,
	`deadlineAt` integer,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `organization_participants` (
	`organizationId` text NOT NULL,
	`roomId` text NOT NULL,
	CONSTRAINT `organization_participants_pkey` PRIMARY KEY(`organizationId`, `roomId`),
	CONSTRAINT `fk_organization_participants_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_organization_participants_roomId_communication_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `communication_rooms`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_participants` (
	`userId` text NOT NULL,
	`roomId` text NOT NULL,
	CONSTRAINT `user_participants_pkey` PRIMARY KEY(`userId`, `roomId`),
	CONSTRAINT `fk_user_participants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_user_participants_roomId_communication_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `communication_rooms`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`bannerUrl` text,
	`imageUrl` text,
	`tagline` text,
	`tags` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`type` text DEFAULT 'other' NOT NULL,
	`stripeProductId` text,
	`features` text,
	CONSTRAINT `fk_services_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `service_likes` (
	`userId` text NOT NULL,
	`serviceId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `service_likes_pkey` PRIMARY KEY(`userId`, `serviceId`),
	CONSTRAINT `fk_service_likes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_service_likes_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `service_plans` (
	`id` text PRIMARY KEY,
	`serviceId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`stripePriceData` text,
	`stripePriceId` text,
	`default` integer DEFAULT false NOT NULL,
	`deployment` text,
	`features` text,
	`status` text DEFAULT 'active' NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'sgd' NOT NULL,
	`type` text DEFAULT 'stripe' NOT NULL,
	CONSTRAINT `fk_service_plans_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `service_reviews` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`serviceId` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`stars` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_service_reviews_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_service_reviews_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`firstName` text NOT NULL,
	`lastName` text,
	`email` text UNIQUE,
	`emailVerified` integer DEFAULT false NOT NULL,
	`emails` text,
	`type` text DEFAULT 'user' NOT NULL,
	`description` text,
	`bannerUrl` text,
	`imageUrl` text,
	`tagline` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`prompt` text,
	`settings` text DEFAULT '{}' NOT NULL,
	`location` text
);
--> statement-breakpoint
CREATE TABLE `user_chats` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`name` text DEFAULT 'Untitled Chat' NOT NULL,
	`messages` text NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_user_chats_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user_follows` (
	`userId` text NOT NULL,
	`followId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `user_follows_pkey` PRIMARY KEY(`userId`, `followId`),
	CONSTRAINT `fk_user_follows_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_user_follows_followId_users_id_fk` FOREIGN KEY (`followId`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_accounts_issuer_accountId_key` ON `auth_accounts` (`issuer`,`accountId`);--> statement-breakpoint
CREATE INDEX `authAccount_userId_idx` ON `auth_accounts` (`userId`);--> statement-breakpoint
CREATE INDEX `authInvitation_organizationId_idx` ON `auth_invitations` (`organizationId`);--> statement-breakpoint
CREATE INDEX `authInvitation_email_idx` ON `auth_invitations` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `auth_members_organizationId_userId_key` ON `auth_members` (`organizationId`,`userId`);--> statement-breakpoint
CREATE INDEX `authMember_userId_idx` ON `auth_members` (`userId`);--> statement-breakpoint
CREATE INDEX `authSession_userId_idx` ON `auth_sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `authVerification_identifier_idx` ON `auth_verifications` (`identifier`);--> statement-breakpoint
CREATE UNIQUE INDEX `call_participants_callId_userId_key` ON `call_participants` (`callId`,`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX `community_follows_userId_tag_key` ON `community_follows` (`userId`,`tag`);