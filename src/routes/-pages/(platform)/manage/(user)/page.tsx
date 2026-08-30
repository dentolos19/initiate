"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, SaveIcon } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "#/components/ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import FormWrapper from "#/components/ui/wrappers/form";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { User } from "#/lib/backend/schema";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import countries from "#/lib/store/countries";
import { notifyLoading } from "#/lib/utils";
import Loading from "#/routes/-pages/loading";

const schema = z.object({
  imageUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  location: z.string(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  prompt: z.string().optional(),
});

export default function Page() {
  const backend = useBackend();
  const session = useSession();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      imageUrl: "",
      bannerUrl: "",
      firstName: "",
      lastName: "",
      location: "SG",
      tagline: "",
      description: "",
      prompt: "",
    },
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User>();

  function createSaveHandler() {
    return form.handleSubmit(async (values) => {
      await notifyLoading(
        "Saving profile...",
        backend.user
          .updateUser("current", values)
          .then(() => {
            toast.success("Profile saved!");
          })
          .catch((error: Error) => {
            console.error(error);
            toast.error(error.message);
          }),
      );
    });
  }

  function handleBannerUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    notifyLoading(
      "Uploading banner...",
      backend.assets
        .uploadFile(file)
        .then((data) => {
          form.setValue("bannerUrl", "/assets/" + data.id);
          toast.success("Banner updated successfully!");
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        }),
    );
  }

  useEffect(() => {
    if (!session.user) return;
    backend.user
      .getUser("current")
      .then((user) => {
        setUser(user);
        form.reset({
          imageUrl: user.imageUrl ?? "",
          bannerUrl: user.bannerUrl ?? "",
          firstName: user.firstName,
          lastName: user.lastName,
          location: user.location ?? "SG",
          tagline: user.tagline ?? "",
          description: user.description ?? "",
          prompt: user.prompt ?? "",
        });
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session.user]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <div className={"my-20 text-center"}>User not found. Please log in or create a profile.</div>;
  }

  return (
    <FormWrapper form={form} onSubmit={createSaveHandler()}>
      <div className={"container mx-auto max-w-4xl space-y-4 p-4"}>
        <div className={"flex gap-4 max-sm:flex-col"}>
          {/* Avatar */}
          <FormField
            control={form.control}
            name={"imageUrl"}
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>Avatar</FormLabel>
                <FormControl>
                  <button
                    className={"size-40 cursor-pointer overflow-hidden rounded-lg"}
                    type={"button"}
                    disabled={formState.isSubmitting}
                    onClick={session.showUserProfile}
                  >
                    <ImageWrapper className={"size-full object-cover"} src={field.value} alt={"Avatar"} />
                  </button>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Banner */}
          <FormField
            control={form.control}
            name={"bannerUrl"}
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>Banner</FormLabel>
                <FormControl>
                  <label className={"w-max cursor-pointer"}>
                    {/* File Input */}
                    <input
                      className={"hidden"}
                      type={"file"}
                      disabled={formState.isSubmitting}
                      onChange={handleBannerUpload}
                    />

                    {/* Visual Representation */}
                    <ImageWrapper className={"h-40 w-auto rounded-lg"} src={field.value} alt={"Banner"} />
                  </label>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className={"flex gap-4 max-sm:flex-col [&>*]:flex-1"}>
          {/* First Name */}
          <FormField
            control={form.control}
            name={"firstName"}
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                    value={field.value}
                    disabled={formState.isSubmitting}
                    onClick={session.showUserProfile}
                    readOnly
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name={"lastName"}
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    value={field.value}
                    disabled={formState.isSubmitting}
                    onClick={session.showUserProfile}
                    readOnly
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Location */}
        <FormField
          control={form.control}
          name={"location"}
          render={({ field, formState }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Select value={field.value} disabled={formState.isSubmitting} onValueChange={field.onChange}>
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

        {/* Tagline */}
        <FormField
          control={form.control}
          name={"tagline"}
          render={({ field, formState }) => (
            <FormItem>
              <FormLabel>Tagline</FormLabel>
              <FormControl>
                <Input
                  value={field.value}
                  placeholder={"I am a software engineer."}
                  disabled={formState.isSubmitting}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>Just met you, who are you?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name={"description"}
          render={({ field, formState }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  value={field.value}
                  placeholder={"I am a software engineer with a passion for building scalable applications."}
                  disabled={formState.isSubmitting}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>What do you want to tell the world?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Prompt */}
        <FormField
          control={form.control}
          name={"prompt"}
          render={({ field, formState }) => (
            <FormItem>
              <FormLabel>Prompt</FormLabel>
              <FormControl>
                <Textarea
                  value={field.value}
                  placeholder={"I want something that boost my business."}
                  disabled={formState.isSubmitting}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>What do you expect from this platform?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className={"flex justify-end gap-2"}>
          <Button type={"button"} variant={"outline"} asChild>
            <Link href={`/users/${session.user!.id}`}>
              <EyeIcon />
              <span>Preview</span>
            </Link>
          </Button>
          <Button type={"submit"} variant={"default"}>
            <SaveIcon />
            <span>Save</span>
          </Button>
        </div>
      </div>
    </FormWrapper>
  );
}
