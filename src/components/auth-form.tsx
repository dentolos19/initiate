"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { authClient } from "#/lib/auth/auth";
import { getAuthDestination } from "#/lib/auth/redirect";
import Link, { useSearchParams } from "#/lib/router";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const isSignUp = mode === "sign-up";
  const destination = getAuthDestination(searchParams.get("redirect"));
  const onboardingDestination = `/onboarding?redirect=${encodeURIComponent(destination)}`;
  const alternateDestination = `${isSignUp ? "/auth" : "/auth/new"}?redirect=${encodeURIComponent(destination)}`;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);

    const cleanName = name.trim();
    if (isSignUp && !cleanName) {
      setError("Enter your name.");
      return;
    }

    setPending(true);
    try {
      const [firstName = "", ...lastNameParts] = cleanName.split(/\s+/);
      const result = isSignUp
        ? await authClient.signUp.email({
            callbackURL: onboardingDestination,
            email: email.trim(),
            lastName: lastNameParts.join(" ") || undefined,
            name: firstName,
            password,
          })
        : await authClient.signIn.email({
            callbackURL: destination,
            email: email.trim(),
            password,
          });

      if (result.error) {
        setError(result.error.message ?? "Authentication failed. Check your details and try again.");
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
            {isSignUp ? "Join the community and start building what matters." : "Sign in to continue to Initiate."}
          </CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
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
            <Input
              id="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? (
              <Loader2 className="animate-spin" />
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
