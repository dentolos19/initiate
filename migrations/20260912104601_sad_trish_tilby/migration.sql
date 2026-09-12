CREATE TABLE `payment_balance_transactions` (
	`id` text PRIMARY KEY,
	`paymentAccountId` text NOT NULL,
	`sourceId` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`availableAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_charges` (
	`id` text PRIMARY KEY,
	`paymentIntentId` text NOT NULL,
	`invoiceId` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`failureCode` text,
	`failureMessage` text,
	`refundedAmount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_payment_charges_paymentIntentId_payment_intents_id_fk` FOREIGN KEY (`paymentIntentId`) REFERENCES `payment_intents`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_payment_charges_invoiceId_service_invoices_id_fk` FOREIGN KEY (`invoiceId`) REFERENCES `service_invoices`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `payment_intents` (
	`id` text PRIMARY KEY,
	`invoiceId` text NOT NULL,
	`paymentAccountId` text NOT NULL,
	`customerReference` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text DEFAULT 'requires_payment_method' NOT NULL,
	`latestChargeId` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_payment_intents_invoiceId_service_invoices_id_fk` FOREIGN KEY (`invoiceId`) REFERENCES `service_invoices`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `payment_refunds` (
	`id` text PRIMARY KEY,
	`chargeId` text NOT NULL,
	`invoiceId` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text DEFAULT 'succeeded' NOT NULL,
	`reason` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_payment_refunds_chargeId_payment_charges_id_fk` FOREIGN KEY (`chargeId`) REFERENCES `payment_charges`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_payment_refunds_invoiceId_service_invoices_id_fk` FOREIGN KEY (`invoiceId`) REFERENCES `service_invoices`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_balance_transactions_sourceId_key` ON `payment_balance_transactions` (`sourceId`);--> statement-breakpoint
CREATE INDEX `payment_charges_paymentIntentId_idx` ON `payment_charges` (`paymentIntentId`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_intents_invoiceId_key` ON `payment_intents` (`invoiceId`);