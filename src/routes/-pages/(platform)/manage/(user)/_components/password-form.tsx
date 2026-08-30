"use client";

import { EyeIcon, EyeOffIcon, KeyRoundIcon, Loader2Icon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { authClient } from "#/lib/auth/auth";

export default function PasswordForm() {
  const [confirmation, setConfirmation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string>();
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [showPasswords, setShowPasswords] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);

    if (newPassword.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("The new passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });
      if (result.error) {
        setError(result.error.message ?? "We couldn't change your password.");
        return;
      }

      setConfirmation("");
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed.");
    } catch (requestError) {
      console.error("Failed to change the user's password.", requestError);
      setError("We couldn't reach the account service. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account security</CardTitle>
        <CardDescription>
          Change your password and decide whether other signed-in devices stay connected.
        </CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type={showPasswords ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
            <div>
              <Label htmlFor="revoke-sessions">Sign out other devices</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Keep this device signed in after the password changes.
              </p>
            </div>
            <Switch
              id="revoke-sessions"
              checked={revokeOtherSessions}
              onCheckedChange={setRevokeOtherSessions}
              disabled={pending}
            />
          </div>

          <Button className="px-0" type="button" variant="link" onClick={() => setShowPasswords((visible) => !visible)}>
            {showPasswords ? <EyeOffIcon /> : <EyeIcon />}
            {showPasswords ? "Hide passwords" : "Show passwords"}
          </Button>

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-6 justify-end border-t">
          <Button disabled={pending} type="submit">
            {pending ? <Loader2Icon className="animate-spin" /> : <KeyRoundIcon />}
            {pending ? "Changing password..." : "Change password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
