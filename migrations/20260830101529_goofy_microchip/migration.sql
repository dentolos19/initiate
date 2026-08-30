ALTER TABLE `service_invoices` RENAME COLUMN `stripeAccountId` TO `paymentAccountId`;--> statement-breakpoint
ALTER TABLE `service_invoices` RENAME COLUMN `stripeCustomerId` TO `customerReference`;--> statement-breakpoint
ALTER TABLE `service_invoices` RENAME COLUMN `stripeInvoiceId` TO `reference`;--> statement-breakpoint
ALTER TABLE `organizations` RENAME COLUMN `stripeAccountId` TO `paymentAccountId`;--> statement-breakpoint
ALTER TABLE `services` RENAME COLUMN `stripeProductId` TO `productReference`;--> statement-breakpoint
ALTER TABLE `service_plans` RENAME COLUMN `stripePriceData` TO `priceData`;--> statement-breakpoint
ALTER TABLE `service_plans` RENAME COLUMN `stripePriceId` TO `priceReference`;--> statement-breakpoint
UPDATE `organizations` SET `paymentAccountId` = NULL;--> statement-breakpoint
UPDATE `services` SET `productReference` = NULL;--> statement-breakpoint
UPDATE `service_plans` SET `priceReference` = NULL, `type` = 'one_time';--> statement-breakpoint
UPDATE `service_invoices` SET
	`paymentAccountId` = 'demo_account_legacy_' || substr(`orderId`, 1, 8),
	`customerReference` = 'demo_customer_legacy_' || substr(coalesce(`userId`, `id`), 1, 8),
	`reference` = 'demo_invoice_legacy_' || substr(`id`, 1, 12);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_service_plans` (
	`id` text PRIMARY KEY,
	`serviceId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`priceData` text,
	`priceReference` text,
	`default` integer DEFAULT false NOT NULL,
	`deployment` text,
	`features` text,
	`status` text DEFAULT 'active' NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'sgd' NOT NULL,
	`type` text DEFAULT 'one_time' NOT NULL,
	CONSTRAINT `fk_service_plans_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_service_plans`(`id`, `serviceId`, `name`, `description`, `priceData`, `priceReference`, `default`, `deployment`, `features`, `status`, `amount`, `currency`, `type`) SELECT `id`, `serviceId`, `name`, `description`, `priceData`, `priceReference`, `default`, `deployment`, `features`, `status`, `amount`, `currency`, `type` FROM `service_plans`;--> statement-breakpoint
DROP TABLE `service_plans`;--> statement-breakpoint
ALTER TABLE `__new_service_plans` RENAME TO `service_plans`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
