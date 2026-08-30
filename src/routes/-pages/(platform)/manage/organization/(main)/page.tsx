"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loadConnectAndInitialize, StripeConnectInstance } from "@stripe/connect-js";
import { BanknoteIcon, EyeIcon, InfoIcon, SaveIcon, UsersIcon } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { MultiSelect } from "#/components/ui/custom/multi-select";
import { RichEditor } from "#/components/ui/custom/rich";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import FormWrapper from "#/components/ui/wrappers/form";
import ImageWrapper from "#/components/ui/wrappers/image";
import { STRIPE_PUBLISHABLE_KEY } from "#/environment";
import useBackend from "#/lib/backend/client";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import industries from "#/lib/store/industries";
import Loading from "#/routes/-pages/loading";

const schema = z.object({
  id: z.string(),
  imageUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  name: z.string(),
  tagline: z.string().optional(),
  tags: z.string().array(),
  description: z.string().optional(),
});

export default function Page() {
  const backend = useBackend();
  const { organization, showOrganizationProfile } = useSession();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      id: "",
      imageUrl: "",
      bannerUrl: "",
      name: "",
      tagline: "",
      tags: [],
      description: "",
    },
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [connect, setConnect] = useState<StripeConnectInstance>();
  const [connectStatus, setConnectStatus] = useState<"loading" | "setup" | "ready">();

  function createSaveHandler() {
    return form.handleSubmit(async (values) => {
      if (!organization) return;
      await backend.organization
        .updateOrganization(organization.id, values)
        .then(() => {
          toast.success("Organization updated successfully!");
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        });
    });
  }

  function handleBannerUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    backend.assets
      .uploadFile(file)
      .then((data) => {
        form.setValue("bannerUrl", "/assets/" + data.id);
        toast.success("Banner updated successfully!");
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  async function handleSetupPayouts() {
    const link = await backend.payments.onboardConnectAccount();
    window.open(link.url, "_blank");
  }

  async function handleManagePayouts() {
    const link = await backend.payments.accessConnectAccount();
    window.open(link.url, "_blank");
  }

  useEffect(() => {
    if (!organization) return;
    setLoading(true);
    const loadOrganization = backend.organization.getOrganization(organization.id).then((org) => {
      form.reset({
        id: org.id,
        imageUrl: org.imageUrl ?? "",
        bannerUrl: org.bannerUrl ?? "",
        name: org.name,
        tagline: org.tagline ?? "",
        description: org.description ?? "",
        tags: org.tags ?? [],
      });
    });

    const loadConnect = STRIPE_PUBLISHABLE_KEY
      ? backend.payments
          .getConnectAccount()
          .then((account) => {
            // setConnectStatus(account.details_submitted && account.charges_enabled && account.payouts_enabled ? "ready" : "setup");
            setConnectStatus(account.details_submitted ? "ready" : "setup");
            return backend.payments.createConnectSession();
          })
          .then((session) => {
            const instance = loadConnectAndInitialize({
              publishableKey: STRIPE_PUBLISHABLE_KEY,
              fetchClientSecret: async () => session.client_secret,
            });
            setConnect(instance);
          })
      : Promise.resolve();

    Promise.all([loadOrganization, loadConnect])
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [organization]);

  if (loading) {
    return <Loading />;
  }

  return (
    <FormWrapper form={form} onSubmit={createSaveHandler()}>
      <div className={"container mx-auto max-w-4xl space-y-4 p-4"}>
        {!STRIPE_PUBLISHABLE_KEY && (
          <Alert>
            <InfoIcon />
            <AlertTitle>Payouts are not configured</AlertTitle>
            <AlertDescription>Add the Stripe keys to enable payout setup and management.</AlertDescription>
          </Alert>
        )}
        {connectStatus === "setup" && (
          <Alert className={"cursor-pointer"} onClick={handleSetupPayouts}>
            <InfoIcon />
            <AlertTitle>Tip</AlertTitle>
            <AlertDescription>
              To receive payouts, you need to set up your Stripe account. Click here or the button below to start the
              setup.
            </AlertDescription>
          </Alert>
        )}

        <div className={"flex gap-4 max-sm:flex-col"}>
          {/* Avatar */}
          <FormField
            control={form.control}
            name={"imageUrl"}
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>Logo</FormLabel>
                <FormControl>
                  <button
                    className={"size-40 cursor-pointer overflow-hidden rounded-lg"}
                    type={"button"}
                    disabled={formState.isSubmitting}
                    onClick={showOrganizationProfile}
                  >
                    <ImageWrapper className={"size-full object-cover"} src={field.value} alt={"Logo"} />
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

        {/* Name */}
        <FormField
          control={form.control}
          name={"name"}
          render={({ field, formState }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  value={field.value}
                  disabled={formState.isSubmitting}
                  onClick={showOrganizationProfile}
                  readOnly
                />
              </FormControl>
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
                  placeholder={"Providing the world something amazing!"}
                  disabled={formState.isSubmitting}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name={"tags"}
          render={({ field, formState }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <MultiSelect
                  defaultValue={field.value}
                  placeholder={"Select tags..."}
                  options={industries}
                  disabled={formState.isSubmitting}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name={"description"}
          render={({ field, formState }) => (
            <FormItem>
              <FormControl>
                <RichEditor value={field.value} disabled={formState.isSubmitting} onValueChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className={"flex flex-wrap gap-2"}>
          {connectStatus === "setup" && (
            <Button className={"mr-auto"} type={"button"} variant={"outline"} onClick={handleSetupPayouts}>
              <BanknoteIcon />
              <span>Setup Payouts</span>
            </Button>
          )}
          {connectStatus === "ready" && (
            <Button className={"mr-auto"} type={"button"} variant={"outline"} onClick={handleManagePayouts}>
              <BanknoteIcon />
              <span>Manage Payouts</span>
            </Button>
          )}
          <div className="bg-muted/40 rounded-lg border px-3 py-2 text-sm font-medium">{organization?.name}</div>
          <Button type={"button"} variant={"outline"} asChild>
            <Link href={`/organizations/${organization!.id}`}>
              <EyeIcon />
              <span>Preview</span>
            </Link>
          </Button>
          <Button type={"button"} variant={"outline"} onClick={showOrganizationProfile}>
            <UsersIcon />
            <span>Members</span>
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
