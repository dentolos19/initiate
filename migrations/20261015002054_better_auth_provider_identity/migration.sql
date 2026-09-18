DROP INDEX IF EXISTS `auth_accounts_issuer_accountId_key`;--> statement-breakpoint
ALTER TABLE `auth_accounts` DROP COLUMN `issuer`;