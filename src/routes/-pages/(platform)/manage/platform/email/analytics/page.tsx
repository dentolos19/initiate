"use client";

import { ExternalLink, MailCheck, ShieldCheck } from "lucide-react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";

export default function EmailAnalyticsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div>
        <p className="text-primary text-sm font-medium">Cloudflare Email Sending</p>
        <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight">Email operations</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Transactional email now runs through the Worker&apos;s native Email Sending binding. Delivery controls and
          domain status live in Cloudflare.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-xl">
              <MailCheck />
            </div>
            <CardTitle>Native delivery</CardTitle>
            <CardDescription>
              Email is composed and sent inside the same Worker that handles the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            The sending domain must be enabled in Cloudflare before production delivery can begin.
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader>
            <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-xl">
              <ShieldCheck />
            </div>
            <CardTitle>Configuration status</CardTitle>
            <CardDescription>
              The `EMAIL` binding and sender identity are configured for this single deployment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="https://dash.cloudflare.com/?to=/:account/email" target="_blank" rel="noreferrer">
                Open Cloudflare Email <ExternalLink />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
