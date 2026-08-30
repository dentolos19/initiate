ALTER TABLE "auth_accounts" ADD COLUMN "issuer" text;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "auth_accounts" WHERE "providerId" <> 'credential') THEN
		RAISE EXCEPTION 'Cannot automatically backfill auth account issuers for non-credential providers. Map each provider to its trusted issuer before applying this migration.';
	END IF;
END $$;--> statement-breakpoint
UPDATE "auth_accounts" SET "issuer" = 'local:credential' WHERE "providerId" = 'credential';--> statement-breakpoint
ALTER TABLE "auth_accounts" ALTER COLUMN "issuer" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_accounts_issuer_accountId_key" ON "auth_accounts" ("issuer","accountId");
