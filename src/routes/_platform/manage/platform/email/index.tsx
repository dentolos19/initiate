import { createFileRoute } from "@tanstack/react-router";
import {
  BellRingIcon,
  GiftIcon,
  MailIcon,
  MessageSquareReplyIcon,
  ReceiptTextIcon,
  SparklesIcon,
  StarIcon,
  WrenchIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { PageDescription, PageHeader, PageHeading, PageShell, PageTitle } from "#/components/ui/page";
import { Switch } from "#/components/ui/switch";
import useBackend from "#/lib/backend/client";
import { EmailPreferences } from "#/lib/backend/connectors/email";

export const Route = createFileRoute("/_platform/manage/platform/email/")({ component: EmailPreferencesPage });

export default function EmailPreferencesPage() {
  const { email } = useBackend();

  const [preferences, setPreferences] = useState<EmailPreferences>({
    newsletters: true,
    reviewReceived: false,
    reviewResponse: false,
    promos: false,
    newFeatures: true,
    maintenance: true,
    paymentConfirm: true,
    serviceUpdates: true,
  });
  const [loadError, setLoadError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const data = await email.getEmailPreferences();
        setPreferences(data);
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Could not load email preferences.";
        setLoadError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    void fetchPreferences();
  }, [email]);

  const updatePreference = async (key: keyof EmailPreferences, value: boolean) => {
    if (key === "paymentConfirm" && !value) return;
    setSaving(true);
    try {
      const newPrefs = { ...preferences, [key]: value };
      const updated = await email.updateEmailPreferences(newPrefs);
      setPreferences(updated);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not update email preferences.");
    } finally {
      setSaving(false);
    }
  };

  const emailTypes = [
    {
      key: "newsletters" as keyof EmailPreferences,
      icon: MailIcon,
      title: "Newsletters",
      description: "Receive new articles and platform news.",
      required: false,
    },
    {
      key: "promos" as keyof EmailPreferences,
      icon: GiftIcon,
      title: "Promotional Emails",
      description: "Receive optional offers and campaigns.",
      required: false,
    },
    {
      key: "newFeatures" as keyof EmailPreferences,
      icon: SparklesIcon,
      title: "New Features",
      description: "Receive announcements when new tools become available.",
      required: false,
    },
    {
      key: "maintenance" as keyof EmailPreferences,
      icon: WrenchIcon,
      title: "Maintenance Notices",
      description: "Receive planned maintenance and downtime notices.",
      required: false,
    },
    {
      key: "paymentConfirm" as keyof EmailPreferences,
      icon: ReceiptTextIcon,
      title: "Payment Confirmations",
      description: "Receive transaction receipts and payment updates.",
      required: true,
    },
    {
      key: "serviceUpdates" as keyof EmailPreferences,
      icon: BellRingIcon,
      title: "Service Updates",
      description: "Receive changes to your services, plans, and orders.",
      required: false,
    },
    {
      key: "reviewReceived" as keyof EmailPreferences,
      icon: StarIcon,
      title: "Reviews Received",
      description: "Receive a message when someone reviews your organization or service.",
      required: false,
    },
    {
      key: "reviewResponse" as keyof EmailPreferences,
      icon: MessageSquareReplyIcon,
      title: "Review Responses",
      description: "Receive a message when someone responds to your review.",
      required: false,
    },
  ];

  if (loading) {
    return (
      <PageShell>
        <PageHeader>
          <PageHeading>
            <PageTitle>Email Preferences</PageTitle>
            <PageDescription>Choose which messages Initiate sends to your email address.</PageDescription>
          </PageHeading>
        </PageHeader>
        <div className="divide-y border-b">
          {Array.from({ length: emailTypes.length }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-4 sm:px-6">
              <div className="bg-muted size-10 animate-pulse rounded-md motion-reduce:animate-none" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="bg-muted h-4 w-48 animate-pulse rounded motion-reduce:animate-none" />
                <div className="bg-muted h-3 w-full max-w-md animate-pulse rounded motion-reduce:animate-none" />
              </div>
              <div className="bg-muted h-6 w-11 animate-pulse rounded-full motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell>
        <PageHeader>
          <PageHeading>
            <PageTitle>Email Preferences</PageTitle>
            <PageDescription>Choose which messages Initiate sends to your email address.</PageDescription>
          </PageHeading>
        </PageHeader>
        <p className="text-destructive border-b px-4 py-6 text-sm sm:px-6" role="alert">
          {loadError} Reload the page to try again.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader>
        <PageHeading>
          <PageTitle>Email Preferences</PageTitle>
          <PageDescription>Choose which messages Initiate sends to your email address.</PageDescription>
        </PageHeading>
        {saving && (
          <p className="text-muted-foreground text-sm" aria-live="polite">
            Saving…
          </p>
        )}
      </PageHeader>

      <div className="divide-y border-b">
        {emailTypes.map((type) => {
          const Icon = type.icon;
          const isEnabled = preferences[type.key];

          return (
            <div key={type.key} className="flex min-w-0 items-center gap-4 px-4 py-4 sm:px-6">
              <div className="bg-muted text-muted-foreground grid size-10 shrink-0 place-items-center rounded-md">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{type.title}</h2>
                  {type.required && <Badge variant="secondary">Required</Badge>}
                </div>
                <p className="text-muted-foreground mt-1 text-sm text-pretty">{type.description}</p>
              </div>
              <Switch
                aria-label={`${type.title} email preference`}
                checked={isEnabled}
                disabled={type.required || saving}
                onCheckedChange={(value) => void updatePreference(type.key, value)}
              />
            </div>
          );
        })}
      </div>

      <p className="text-muted-foreground px-4 py-4 text-sm sm:px-6">
        Security and payment confirmation emails are required for account protection and transaction records.
      </p>
    </PageShell>
  );
}
