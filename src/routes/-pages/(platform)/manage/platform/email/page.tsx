"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import useBackend from "#/lib/backend/client";
import { EmailPreferences } from "#/lib/backend/connectors/email";

export default function EmailPreferencesPage() {
  const backend = useBackend();

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const data = await backend.email.getEmailPreferences();
        setPreferences(data);
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Could not load email preferences.");
      } finally {
        setLoading(false);
      }
    }
    fetchPreferences();
  }, []);

  const updatePreference = async (key: keyof EmailPreferences, value: boolean) => {
    if (key === "paymentConfirm" && !value) return;
    setSaving(true);
    try {
      const newPrefs = { ...preferences, [key]: value };
      const updated = await backend.email.updateEmailPreferences(newPrefs);
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
      icon: "📧",
      title: "Newsletter Updates",
      description: "Get notified when new newsletter posts are published",
      color: "text-green-400",
      required: false,
    },
    {
      key: "promos" as keyof EmailPreferences,
      icon: "🎁",
      title: "Promotional Emails",
      description: "Special offers and marketing campaigns (opt-in)",
      color: "text-amber-400",
      required: false,
    },
    {
      key: "newFeatures" as keyof EmailPreferences,
      icon: "✨",
      title: "New Features",
      description: "Product updates and new feature announcements",
      color: "text-purple-400",
      required: false,
    },
    {
      key: "maintenance" as keyof EmailPreferences,
      icon: "🔧",
      title: "Maintenance Notices",
      description: "System maintenance and downtime notifications",
      color: "text-orange-400",
      required: false,
    },
    {
      key: "paymentConfirm" as keyof EmailPreferences,
      icon: "💳",
      title: "Payment Confirmations",
      description: "Transaction receipts and payment notifications",
      color: "text-green-400",
      required: true,
    },
    {
      key: "serviceUpdates" as keyof EmailPreferences,
      icon: "⚙️",
      title: "Service Updates",
      description: "Changes to your services and plan updates",
      color: "text-cyan-400",
      required: false,
    },
  ];

  if (loading) {
    return (
      <div className="bg-background min-h-screen p-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-foreground mb-6 text-2xl font-bold">Email Preferences</h1>
          <div className="space-y-4">
            {Array.from({ length: emailTypes.length }).map((_, i) => (
              <div key={i} className="bg-muted border-border animate-pulse rounded-lg border p-6">
                <div className="bg-muted-foreground mb-2 h-4 w-3/4 rounded"></div>
                <div className="bg-muted-foreground h-3 w-1/2 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-foreground mb-6 text-2xl font-bold">Email Preferences</h1>

        <div className="space-y-6">
          <div className="bg-muted border-border rounded-lg border p-6">
            <h2 className="text-foreground mb-2 flex items-center space-x-2 text-lg font-semibold">
              <span>📧</span>
              <span>Email Notification Preferences</span>
            </h2>
            <p className="text-muted-foreground text-sm">Control which emails you receive from Initiate Global</p>
          </div>

          <div className="grid gap-4">
            {emailTypes.map((type) => {
              const isEnabled = preferences[type.key];
              return (
                <div key={type.key} className="bg-card border-border rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`bg-muted rounded-lg p-2 ${type.color} text-2xl`}>{type.icon}</div>
                      <div>
                        <h3 className="text-foreground flex items-center space-x-2 font-medium">
                          <span>{type.title}</span>
                          {type.required && (
                            <span className="rounded bg-green-600 px-2 py-1 text-xs text-white">Required</span>
                          )}
                        </h3>
                        <p className="text-muted-foreground text-sm">{type.description}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => updatePreference(type.key, e.target.checked)}
                        disabled={type.required || saving}
                        className="peer sr-only"
                      />
                      {/* Track */}
                      <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-emerald-500 dark:bg-gray-700" />
                      {/* Thumb */}
                      <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-muted border-border rounded-lg border p-6">
            <p className="text-muted-foreground text-sm">
              Note: Form.Process security and transaction emails cannot be disabled as they are required for account
              security and transaction records.
            </p>
          </div>

          {saving && (
            <div className="fixed top-4 right-4 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-lg">
              Saving preferences...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
