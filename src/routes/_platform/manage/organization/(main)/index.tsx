import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { EyeIcon, InfoIcon, SaveIcon, UsersIcon, WalletCardsIcon } from "lucide-react";
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
import { PageContent, PageDescription, PageHeader, PageHeading, PageShell, PageTitle } from "#/components/ui/page";
import FormWrapper from "#/components/ui/wrappers/form";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { PaymentAccount } from "#/lib/backend/schema/payments";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import industries from "#/lib/store/industries";
import { formatAmount } from "#/lib/utils";
import Loading from "#/routes/-components/loading";

const schema = z.object({
  id: z.string(),
  imageUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Enter an organization name.")
    .max(100, "Keep the organization name under 100 characters."),
  tagline: z.string().optional(),
  tags: z.string().array(),
  description: z.string().optional(),
});

export const Route = createFileRoute("/_platform/manage/organization/(main)/")({ component: Page });

export default function Page() {
  const backend = useBackend();
  const { organization, refreshOrganization } = useSession();

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
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount>();

  const saveOrganization = form.handleSubmit(async (values) => {
    if (!organization) return;

    try {
      const updatedOrganization = await backend.organization.updateOrganization(organization.id, values);
      await refreshOrganization();
      form.reset({
        ...values,
        name: updatedOrganization.name,
      });
      toast.success("Organization saved.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Unable to update the organization.");
    }
  });

  function handleBannerUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    backend.assets
      .uploadFile(file)
      .then((data) => {
        form.setValue("bannerUrl", "/assets/" + data.id);
        toast.success("Banner uploaded. Save the organization to apply it.");
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    backend.assets
      .uploadFile(file)
      .then((data) => {
        form.setValue("imageUrl", "/assets/" + data.id, { shouldDirty: true });
        toast.success("Logo uploaded. Save the organization to apply it.");
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
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

    const loadPayments = backend.payments.getAccount().then(setPaymentAccount);

    Promise.all([loadOrganization, loadPayments])
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
    <PageShell>
      <PageHeader>
        <PageHeading>
          <PageTitle>Manage Organization</PageTitle>
          <PageDescription>Update your organization profile and review its demo payment account.</PageDescription>
        </PageHeading>
      </PageHeader>
      <FormWrapper form={form} onSubmit={saveOrganization}>
        <PageContent className="space-y-5">
          <Alert className="border-primary/30 bg-primary/5">
            <InfoIcon />
            <AlertTitle>Demo payment environment</AlertTitle>
            <AlertDescription>
              Balances, payments, declines, and refunds are simulated locally. No financial account or real transfer is
              created.
            </AlertDescription>
          </Alert>

          <section className="border-y">
            <div className="border-b p-4">
              <div>
                <div className="flex items-center gap-2">
                  <WalletCardsIcon className="size-5" />
                  <h2 className="font-semibold">Payment account</h2>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {paymentAccount ? `Automatically active · ${paymentAccount.id}` : "Preparing demo payments…"}
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 sm:divide-x">
              <div className="p-4">
                <p className="text-muted-foreground text-xs">Available</p>
                <p className="text-xl font-semibold">
                  {formatAmount(paymentAccount?.availableBalance ?? 0, paymentAccount?.currency ?? "sgd")}
                </p>
                <p className="text-muted-foreground text-xs">{paymentAccount?.paidInvoices ?? 0} paid invoices</p>
              </div>
              <div className="border-t p-4 sm:border-t-0">
                <p className="text-muted-foreground text-xs">Awaiting payment</p>
                <p className="text-xl font-semibold">
                  {formatAmount(paymentAccount?.pendingBalance ?? 0, paymentAccount?.currency ?? "sgd")}
                </p>
                <p className="text-muted-foreground text-xs">{paymentAccount?.openInvoices ?? 0} open invoices</p>
              </div>
              <div className="border-t p-4 sm:border-t-0">
                <p className="text-muted-foreground text-xs">Refunded</p>
                <p className="text-xl font-semibold">
                  {formatAmount(paymentAccount?.refundedAmount ?? 0, paymentAccount?.currency ?? "sgd")}
                </p>
                <p className="text-muted-foreground text-xs">Simulated lifecycle total</p>
              </div>
            </div>
          </section>

          <div className={"flex gap-4 max-sm:flex-col"}>
            {/* Avatar */}
            <FormField
              control={form.control}
              name={"imageUrl"}
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <label className={"block size-40 cursor-pointer overflow-hidden rounded-lg"}>
                      <input
                        className={"hidden"}
                        type={"file"}
                        accept={"image/*"}
                        disabled={formState.isSubmitting}
                        onChange={handleLogoUpload}
                      />
                      <ImageWrapper className={"size-full object-cover"} src={field.value} alt={"Logo"} />
                    </label>
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
                  <Input {...field} autoComplete={"organization"} disabled={formState.isSubmitting} />
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
                    placeholder={"Helping teams build better products."}
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
                    placeholder={"Select Tags…"}
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
            <div className="border px-3 py-2 text-sm font-medium">{organization?.name}</div>
            <Button type={"button"} variant={"outline"} asChild>
              <Link href={`/organizations/${organization!.id}`}>
                <EyeIcon />
                <span>Preview</span>
              </Link>
            </Button>
            <Button type={"button"} variant={"outline"} asChild>
              <Link href={"/manage/organization/members"}>
                <UsersIcon />
                <span>Members</span>
              </Link>
            </Button>
            <Button type={"submit"} variant={"default"} disabled={form.formState.isSubmitting}>
              <SaveIcon />
              <span>{form.formState.isSubmitting ? "Saving…" : "Save Organization"}</span>
            </Button>
          </div>
        </PageContent>
      </FormWrapper>
    </PageShell>
  );
}
