"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "#/components/ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import FormWrapper from "#/components/ui/wrappers/form";
import ImageWrapper from "#/components/ui/wrappers/image";
import { authClient } from "#/lib/auth/auth";
import useBackend from "#/lib/backend/client";
import { User } from "#/lib/backend/schema";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import countries from "#/lib/store/countries";
import PasswordForm from "#/routes/-pages/(platform)/manage/(user)/_components/password-form";
import Loading from "#/routes/-pages/loading";

const schema = z.object({
  bannerUrl: z.string().optional(),
  description: z.string().max(2_000, "Keep your description under 2,000 characters.").optional(),
  firstName: z.string().trim().min(1, "Enter your first name.").max(80, "Keep your first name under 80 characters."),
  imageUrl: z.string().optional(),
  lastName: z.string().trim().max(80, "Keep your last name under 80 characters."),
  location: z.string().min(1, "Select your location."),
  prompt: z.string().max(1_000, "Keep your goals under 1,000 characters.").optional(),
  tagline: z.string().max(160, "Keep your tagline under 160 characters.").optional(),
});

type ProfileValues = z.infer<typeof schema>;

export default function Page() {
  const backend = useBackend();
  const session = useSession();
  const form = useForm<ProfileValues>({
    defaultValues: {
      bannerUrl: "",
      description: "",
      firstName: "",
      imageUrl: "",
      lastName: "",
      location: "SG",
      prompt: "",
      tagline: "",
    },
    resolver: zodResolver(schema),
  });

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<"avatar" | "banner">();
  const [user, setUser] = useState<User>();

  const save = form.handleSubmit(async (values) => {
    try {
      const authResult = await authClient.updateUser({
        image: values.imageUrl || null,
        lastName: values.lastName,
        name: values.firstName,
      });
      if (authResult.error) {
        throw new Error(authResult.error.message ?? "Better Auth could not update your account.");
      }

      const updatedUser = await backend.user.updateUser("current", {
        bannerUrl: values.bannerUrl,
        description: values.description,
        location: values.location,
        prompt: values.prompt,
        tagline: values.tagline,
      });

      setUser(updatedUser);
      await session.refreshUser();
      form.reset(values);
      toast.success("Profile saved.");
    } catch (saveError) {
      console.error("Failed to update the user's profile.", saveError);
      toast.error(saveError instanceof Error ? saveError.message : "We couldn't save your profile.");
    }
  });

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>, target: "avatar" | "banner") => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Choose an image smaller than 5 MB.");
      return;
    }

    setUploading(target);
    try {
      const asset = await backend.assets.uploadFile(file);
      form.setValue(target === "avatar" ? "imageUrl" : "bannerUrl", `/assets/${asset.id}`, {
        shouldDirty: true,
      });
      toast.success(target === "avatar" ? "Avatar ready to save." : "Banner ready to save.");
    } catch (uploadError) {
      console.error(`Failed to upload the user's ${target}.`, uploadError);
      toast.error(uploadError instanceof Error ? uploadError.message : "We couldn't upload that image.");
    } finally {
      setUploading(undefined);
    }
  };

  useEffect(() => {
    if (!session.user) return;

    backend.user
      .getUser("current")
      .then((currentUser) => {
        setUser(currentUser);
        form.reset({
          bannerUrl: currentUser.bannerUrl ?? "",
          description: currentUser.description ?? "",
          firstName: currentUser.firstName,
          imageUrl: currentUser.imageUrl ?? "",
          lastName: currentUser.lastName,
          location: currentUser.location ?? "SG",
          prompt: currentUser.prompt ?? "",
          tagline: currentUser.tagline ?? "",
        });
      })
      .catch((loadError: Error) => {
        console.error("Failed to load the user's profile.", loadError);
        toast.error(loadError.message);
      })
      .finally(() => setLoading(false));
  }, [backend.user, form, session.user]);

  if (loading) return <Loading />;

  if (!user) {
    return <div className="my-20 text-center">We couldn't load your profile. Sign in again and retry.</div>;
  }

  const submitting = form.formState.isSubmitting;

  return (
    <main className="space-y-8">
      <FormWrapper form={form} onSubmit={save}>
        <div className="container mx-auto max-w-4xl space-y-4 p-4">
          <div className="flex gap-4 max-sm:flex-col">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <FormControl>
                    <label className="relative block size-40 cursor-pointer overflow-hidden rounded-lg">
                      <input
                        className="hidden"
                        type="file"
                        accept="image/*"
                        disabled={submitting || uploading !== undefined}
                        onChange={(event) => void uploadImage(event, "avatar")}
                      />
                      <ImageWrapper className="size-full object-cover" src={field.value} alt="Avatar" />
                      {uploading === "avatar" && (
                        <span className="bg-background/80 absolute inset-0 grid place-content-center">
                          <Loader2Icon className="animate-spin" />
                        </span>
                      )}
                    </label>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bannerUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner</FormLabel>
                  <FormControl>
                    <label className="relative block w-max max-w-full cursor-pointer overflow-hidden rounded-lg">
                      <input
                        className="hidden"
                        type="file"
                        accept="image/*"
                        disabled={submitting || uploading !== undefined}
                        onChange={(event) => void uploadImage(event, "banner")}
                      />
                      <ImageWrapper className="h-40 w-auto max-w-full object-cover" src={field.value} alt="Banner" />
                      {uploading === "banner" && (
                        <span className="bg-background/80 absolute inset-0 grid place-content-center">
                          <Loader2Icon className="animate-spin" />
                        </span>
                      )}
                    </label>
                  </FormControl>
                  <FormDescription>Choose an image up to 5 MB.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-4 max-sm:flex-col [&>*]:flex-1">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input autoComplete="given-name" disabled={submitting} {...field} />
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
                    <Input autoComplete="family-name" disabled={submitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Select value={field.value} disabled={submitting} onValueChange={field.onChange}>
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
            name="tagline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tagline</FormLabel>
                <FormControl>
                  <Input placeholder="I am a software engineer." disabled={submitting} {...field} />
                </FormControl>
                <FormDescription>Just met you, who are you?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="I am a software engineer with a passion for building scalable applications."
                    disabled={submitting}
                    {...field}
                  />
                </FormControl>
                <FormDescription>What do you want to tell the world?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Textarea placeholder="I want something that boosts my business." disabled={submitting} {...field} />
                </FormControl>
                <FormDescription>What do you expect from this platform?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href={`/users/${user.id}`}>
                <EyeIcon />
                <span>Preview</span>
              </Link>
            </Button>
            <Button type="submit" disabled={submitting || uploading !== undefined || !form.formState.isDirty}>
              {submitting ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
              <span>{submitting ? "Saving..." : "Save"}</span>
            </Button>
          </div>
        </div>
      </FormWrapper>

      <PasswordForm />
    </main>
  );
}
