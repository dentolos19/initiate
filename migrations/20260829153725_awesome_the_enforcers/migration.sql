CREATE INDEX "authAccount_userId_idx" ON "auth_accounts" ("userId");--> statement-breakpoint
CREATE INDEX "authInvitation_organizationId_idx" ON "auth_invitations" ("organizationId");--> statement-breakpoint
CREATE INDEX "authInvitation_email_idx" ON "auth_invitations" ("email");--> statement-breakpoint
CREATE INDEX "authMember_userId_idx" ON "auth_members" ("userId");--> statement-breakpoint
CREATE INDEX "authSession_userId_idx" ON "auth_sessions" ("userId");--> statement-breakpoint
CREATE INDEX "authVerification_identifier_idx" ON "auth_verifications" ("identifier");