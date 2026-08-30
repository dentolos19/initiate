import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, Loader2Icon, MapPinIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import FormWrapper from "#/components/ui/wrappers/form";
import useBackend from "#/lib/backend/client";
import { useSession } from "#/lib/providers/session";
import countries from "#/lib/store/countries";

const schema = z.object({
  location: z.string().min(1, "Select your location."),
});

export default function ProfileOnboarding({ onNext }: { onNext: () => void }) {
  const backend = useBackend();
  const session = useSession();
  const form = useForm({
    defaultValues: {
      location: "",
    },
    resolver: zodResolver(schema),
  });

  const save = form.handleSubmit(async (values) => {
    try {
      await backend.user.updateUser("current", values);
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
      location: session.user.location ?? "",
    });
  }, [form, session.user]);

  return (
    <FormWrapper className="w-full max-w-md" form={form} onSubmit={save}>
      <Card>
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-xl">
            <MapPinIcon className="size-5" />
          </div>
          <CardTitle>One last detail</CardTitle>
          <CardDescription>
            Add your location so Initiate can show services, people, and resources that are relevant to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Select value={field.value} disabled={form.formState.isSubmitting} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your location" />
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
        </CardContent>
        <CardFooter className="mt-6 justify-end border-t">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : <ArrowRightIcon />}
            {form.formState.isSubmitting ? "Saving..." : "Finish setup"}
          </Button>
        </CardFooter>
      </Card>
    </FormWrapper>
  );
}
