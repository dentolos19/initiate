import { zodResolver } from "@hookform/resolvers/zod";
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
import { User } from "#/lib/backend/schema";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import countries from "#/lib/store/countries";

const schema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  location: z.string().nonempty("Please select your location"),
  terms: z.boolean().refine((value) => value, { message: "You must accept the terms of service" }),
});

export default function ProfileOnboarding(props: { user: User; onNext: () => void }) {
  const backend = useBackend();
  const session = useSession();
  const form = useForm({
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      location: "",
      terms: false,
    },
    resolver: zodResolver(schema),
  });

  function createSaveHandler() {
    return form.handleSubmit(async (values) => {
      await backend.user
        .updateUser("current", values)
        .then(() => {
          session.refreshUser();
          props.onNext();
        })
        .catch((error) => {
          console.error(error);
          toast.error(error.message);
        });
    });
  }

  useEffect(() => {
    if (!session.user) return;
    form.reset({
      firstName: session.user.firstName,
      lastName: session.user.lastName ?? "",
      email: session.user.emails[0],
      location: session.user.location ?? "",
      terms: false,
    });
  }, []);

  return (
    <FormWrapper className={"w-100"} form={form} onSubmit={createSaveHandler()}>
      <Card>
        <CardHeader>
          <CardTitle>Welcome onboard!</CardTitle>
          <CardDescription>We're excited for you to come onboard into the Initiate Platform!</CardDescription>
        </CardHeader>
        <CardContent className={"space-y-4"}>
          <div className={"flex gap-4 [&>*]:flex-1"}>
            {/* First Name */}
            <FormField
              control={form.control}
              name={"firstName"}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input value={field.value} readOnly />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Last Name */}
            <FormField
              control={form.control}
              name={"lastName"}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input value={field.value} readOnly />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Email */}
          <FormField
            control={form.control}
            name={"email"}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input value={field.value} readOnly />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name={"location"}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={"w-full"}>
                      <SelectValue placeholder={"Select location..."} />
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

          {/* Terms of Service */}
          <FormField
            control={form.control}
            name={"terms"}
            render={({ field }) => (
              <FormItem>
                <div className={"flex items-center gap-2"}>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className={"text-sm"}>
                    <span>I accept the</span>
                    <Link className={"text-primary hover:underline"} href={"/terms"} target={"_blank"}>
                      Terms of Service
                    </Link>
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
        <CardFooter>
          <Button type={"submit"} variant={"default"}>
            Next
          </Button>
        </CardFooter>
      </Card>
    </FormWrapper>
  );
}
