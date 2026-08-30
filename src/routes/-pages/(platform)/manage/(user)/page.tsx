"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, ImagePlusIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
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
    <main className="container mx-auto w-full max-w-5xl space-y-8 p-4 py-8">
      <div>
        <p className="text-primary text-sm font-medium">Settings</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Profile and account</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          Update how people see you on Initiate and manage the password you use to sign in.
        </p>
      </div>

      <FormWrapper form={form} onSubmit={save}>
        <Card>
          <CardHeader>
            <CardTitle>Public profile</CardTitle>
            <CardDescription>Your name, photo, and profile details appear across the community.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-[10rem_1fr]">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar</FormLabel>
                    <FormControl>
                      <label className="group bg-muted relative block aspect-square cursor-pointer overflow-hidden rounded-xl border">
                        <input
                          className="sr-only"
                          type="file"
                          accept="image/*"
                          disabled={submitting || uploading !== undefined}
                          onChange={(event) => void uploadImage(event, "avatar")}
                        />
                        <ImageWrapper className="size-full object-cover" src={field.value} alt="Profile avatar" />
                        <span className="bg-background/90 absolute inset-x-2 bottom-2 flex items-center justify-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium shadow-sm">
                          {uploading === "avatar" ? (
                            <Loader2Icon className="size-3.5 animate-spin" />
                          ) : (
                            <ImagePlusIcon className="size-3.5" />
                          )}
                          {uploading === "avatar" ? "Uploading..." : "Change photo"}
                        </span>
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
                    <FormLabel>Profile banner</FormLabel>
                    <FormControl>
                      <label className="group bg-muted relative block h-40 cursor-pointer overflow-hidden rounded-xl border">
                        <input
                          className="sr-only"
                          type="file"
                          accept="image/*"
                          disabled={submitting || uploading !== undefined}
                          onChange={(event) => void uploadImage(event, "banner")}
                        />
                        <ImageWrapper className="size-full object-cover" src={field.value} alt="Profile banner" />
                        <span className="bg-background/90 absolute right-2 bottom-2 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium shadow-sm">
                          {uploading === "banner" ? (
                            <Loader2Icon className="size-3.5 animate-spin" />
                          ) : (
                            <ImagePlusIcon className="size-3.5" />
                          )}
                          {uploading === "banner" ? "Uploading..." : "Change banner"}
                        </span>
                      </label>
                    </FormControl>
                    <FormDescription>JPG, PNG, or WebP. Up to 5 MB.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
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
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input autoComplete="family-name" disabled={submitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="account-email">
                Email
              </label>
              <Input id="account-email" value={user.emails[0] ?? ""} disabled readOnly />
              <p className="text-muted-foreground text-sm">This is the email you use to sign in.</p>
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

            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagline</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Software engineer building tools for small teams."
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>A short introduction shown near your name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About you</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-28"
                      placeholder="Share what you work on, what you know, and who you want to meet."
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What are you looking for?</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-24"
                      placeholder="I want to meet collaborators who can help launch my product."
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Initiate uses this to tailor suggestions to your goals.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="mt-6 justify-end gap-2 border-t">
            <Button type="button" variant="outline" asChild>
              <Link href={`/users/${user.id}`}>
                <EyeIcon />
                Preview profile
              </Link>
            </Button>
            <Button type="submit" disabled={submitting || uploading !== undefined || !form.formState.isDirty}>
              {submitting ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </CardFooter>
        </Card>
      </FormWrapper>

      <PasswordForm />
    </main>
  );
}
