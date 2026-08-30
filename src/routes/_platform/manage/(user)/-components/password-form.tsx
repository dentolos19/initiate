import { EyeIcon, EyeOffIcon, KeyRoundIcon, Loader2Icon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
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
      const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions });
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
    <form className="space-y-4 border-t p-4 pt-6 sm:p-6" onSubmit={submit}>
      <div>
        <h2 className="text-lg font-semibold">Account Security</h2>
        <p className="text-muted-foreground mt-1 text-sm">Change the password you use to sign in.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
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
          <Label htmlFor="new-password">New Password</Label>
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
          <Label htmlFor="confirm-password">Confirm New Password</Label>
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

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Switch
            id="revoke-sessions"
            checked={revokeOtherSessions}
            onCheckedChange={setRevokeOtherSessions}
            disabled={pending}
          />
          <div>
            <Label htmlFor="revoke-sessions">Sign Out Other Devices</Label>
            <p className="text-muted-foreground text-xs">Keep only this device signed in after the change.</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={() => setShowPasswords((visible) => !visible)}>
          {showPasswords ? <EyeOffIcon /> : <EyeIcon />}
          {showPasswords ? "Hide Passwords" : "Show Passwords"}
        </Button>
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button disabled={pending} type="submit">
          {pending ? <Loader2Icon className="animate-spin motion-reduce:animate-none" /> : <KeyRoundIcon />}
          {pending ? "Changing…" : "Change Password"}
        </Button>
      </div>
    </form>
  );
}
