import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import FormWrapper from "#/components/ui/wrappers/form";
import useBackend from "#/lib/backend/client";
import { useSession } from "#/lib/providers/session";
import countries from "#/lib/store/countries";

const schema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim(),
  location: z.string().min(1, "Select your location."),
  terms: z.boolean().refine(Boolean, "Accept the terms and privacy policy to continue."),
});

export default function ProfileOnboarding({ onNext }: { onNext: () => void }) {
  const backend = useBackend();
  const session = useSession();
  const form = useForm({
    defaultValues: { firstName: "", lastName: "", location: "", terms: false },
    resolver: zodResolver(schema),
  });

  const save = form.handleSubmit(async ({ firstName, lastName, location }) => {
    try {
      await backend.user.updateUser("current", { firstName, lastName: lastName || null, location });
      await session.refreshUser();
      onNext();
    } catch (saveError) {
      console.error("Failed to finish the user's profile setup.", saveError);
      toast.error(saveError instanceof Error ? saveError.message : "We couldn't finish your profile setup.");
    }
  });

  useEffect(() => {
    if (!session.user) return;
    form.reset({
      firstName: session.user.firstName,
      lastName: session.user.lastName ?? "",
      location: session.user.location ?? "",
      terms: false,
    });
  }, [form, session.user]);

  return (
    <FormWrapper className="w-100 max-w-full" form={form} onSubmit={save}>
      <Card>
        <CardHeader>
          <CardTitle>Welcome onboard!</CardTitle>
          <CardDescription>Complete your profile to start using Initiate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 max-sm:flex-col [&>*]:flex-1">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="given-name" disabled={form.formState.isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="family-name" disabled={form.formState.isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input value={session.user?.emails[0] ?? ""} readOnly />
            </FormControl>
          </FormItem>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Select value={field.value} disabled={form.formState.isSubmitting} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.label}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-2">
                  <FormControl>
                    <Checkbox className="mt-0.5" checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="text-muted-foreground block cursor-pointer text-sm leading-5 font-normal">
                    I accept the&nbsp;
                    <a
                      className="text-primary hover:underline"
                      href="https://dennise.me/terms"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Terms of Service
                    </a>
                    &nbsp;and&nbsp;
                    <a
                      className="text-primary hover:underline"
                      href="https://dennise.me/privacy"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Privacy Policy
                    </a>
                    .
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2Icon className="animate-spin" />}
            {form.formState.isSubmitting ? "Saving..." : "Finish setup"}
          </Button>
        </CardFooter>
      </Card>
    </FormWrapper>
  );
}
