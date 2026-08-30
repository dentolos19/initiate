"use client";

import { ArrowRight, EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { authClient } from "#/lib/auth/auth";
import { getAuthDestination } from "#/lib/auth/redirect";
import Link, { useSearchParams } from "#/lib/router";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isSignUp = mode === "sign-up";
  const destination = getAuthDestination(searchParams.get("redirect"));
  const onboardingDestination = `/onboarding?redirect=${encodeURIComponent(destination)}`;
  const alternateDestination = `${isSignUp ? "/auth" : "/auth/new"}?redirect=${encodeURIComponent(destination)}`;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);

    const cleanFirstName = firstName.trim();
    if (isSignUp && !cleanFirstName) {
      setError("Enter your first name.");
      return;
    }
    if (isSignUp && !termsAccepted) {
      setError("Accept the terms and privacy policy to create an account.");
      return;
    }

    setPending(true);

    try {
      const result = isSignUp
        ? await authClient.signUp.email({
            callbackURL: onboardingDestination,
            email: email.trim(),
            lastName: lastName.trim() || undefined,
            name: cleanFirstName,
            password,
          })
        : await authClient.signIn.email({
            callbackURL: destination,
            email: email.trim(),
            password,
          });

      if (result.error) {
        setError(result.error.message ?? "We couldn't sign you in. Check your details and try again.");
        return;
      }

      window.location.assign(isSignUp ? onboardingDestination : destination);
    } catch (requestError) {
      console.error("Failed to authenticate the user.", requestError);
      setError("We couldn't reach the sign-in service. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="border-border/70 bg-background/90 shadow-primary/10 relative z-10 w-full max-w-md shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-3 pb-5 text-center">
        <div className="bg-primary font-heading text-primary-foreground mx-auto flex size-11 items-center justify-center rounded-2xl text-lg font-bold">
          I
        </div>
        <div>
          <CardTitle className="font-heading text-2xl">{isSignUp ? "Create your account" : "Welcome back"}</CardTitle>
          <CardDescription className="mt-2">
            {isSignUp ? "Set up your Initiate profile in a minute." : "Sign in to continue where you left off."}
          </CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-4">
          {isSignUp && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  autoComplete="given-name"
                  autoFocus
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">
                  Last name <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="last-name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus={!isSignUp}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                className="pr-10"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <Button
                className="text-muted-foreground absolute top-0 right-0"
                type="button"
                variant="ghost"
                size="icon"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </div>
            {isSignUp && <p className="text-muted-foreground text-xs">Use at least 8 characters.</p>}
          </div>
          {isSignUp && (
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                className="mt-0.5"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              />
              <Label className="text-muted-foreground text-xs leading-5" htmlFor="terms">
                I agree to the{" "}
                <a
                  className="text-foreground underline underline-offset-2"
                  href="https://dennise.me/terms"
                  target="_blank"
                  rel="noreferrer"
                >
                  terms
                </a>{" "}
                and{" "}
                <a
                  className="text-foreground underline underline-offset-2"
                  href="https://dennise.me/privacy"
                  target="_blank"
                  rel="noreferrer"
                >
                  privacy policy
                </a>
                .
              </Label>
            </div>
          )}
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? (
              <>
                <Loader2 className="animate-spin" />
                {isSignUp ? "Creating account..." : "Signing in..."}
              </>
            ) : (
              <>
                {isSignUp ? "Create account" : "Sign in"}
                <ArrowRight />
              </>
            )}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="border-border/60 text-muted-foreground justify-center border-t pt-5 text-sm">
        {isSignUp ? "Already have an account?" : "New to Initiate?"}
        <Button asChild variant="link" className="px-2">
          <Link href={alternateDestination}>{isSignUp ? "Sign in" : "Create one"}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
