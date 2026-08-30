import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { PageContent, PageDescription, PageHeader, PageHeading, PageShell, PageTitle } from "#/components/ui/page";
import { authClient } from "#/lib/auth/auth";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const Route = createFileRoute("/_platform/manage/(user)/organization/new/")({ component: Page });

export default function Page() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    const result = await authClient.organization.create({ name, slug });
    if (result.error || !result.data) {
      setError(result.error?.message ?? "Could not create the organization.");
      setPending(false);
      return;
    }

    await authClient.organization.setActive({ organizationId: result.data.id });
    window.location.assign("/manage/organization");
  }

  return (
    <PageShell>
      <PageHeader>
        <PageHeading>
          <PageTitle>Create an Organization</PageTitle>
          <PageDescription>Give your team a shared home for services, projects, and conversations.</PageDescription>
        </PageHeading>
      </PageHeader>
      <form onSubmit={submit}>
        <PageContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="organization-name">Name</Label>
            <Input
              id="organization-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSlug(slugify(event.target.value));
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization-slug">Slug</Label>
            <Input
              id="organization-slug"
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              required
            />
            <p className="text-muted-foreground text-xs">Used as a stable identifier for your organization.</p>
          </div>
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <Button className="w-full" disabled={pending} type="submit">
            {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
            Create Organization
          </Button>
        </PageContent>
      </form>
    </PageShell>
  );
}
