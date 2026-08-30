import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftIcon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { PageContent, PageDescription, PageHeader, PageHeading, PageShell, PageTitle } from "#/components/ui/page";
import useBackend from "#/lib/backend/client";
import { ResourceGrant } from "#/lib/backend/schema";
import Link from "#/lib/router";
import { useParams, useRouter } from "#/lib/router";

export const Route = createFileRoute("/_platform/manage/platform/resources/grants/$id/")({
  component: GrantPage,
});

export default function GrantPage() {
  const backend = useBackend();
  const router = useRouter();
  const params = useParams();
  const grantId = params.id as string;
  const isNew = grantId === "new";

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!isNew);
  const [confirmation, setConfirmation] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    location: "",
    description: "",
    grant: "",
    websiteUrl: "",
    applyUrl: "",
    providerEmail: "",
    providerPhone: "",
    deadlineAt: "",
    criteria: [""],
    process: [""],
  });

  // Fetch existing grant data if editing
  useEffect(() => {
    if (isNew) {
      setFetchLoading(false);
      return;
    }

    const fetchGrant = async () => {
      try {
        const grants = await backend.resources.getGrants();
        const grant = grants.find((g: ResourceGrant) => g.id === grantId);

        if (!grant) {
          toast.error("Grant not found");
          router.push("/manage/platform/resources");
          return;
        }

        // Populate form with existing data
        setFormData({
          name: grant.name || "",
          provider: grant.provider || "",
          location: grant.location || "",
          description: grant.description || "",
          grant: grant.grant || "",
          websiteUrl: grant.websiteUrl || "",
          applyUrl: grant.applyUrl || "",
          providerEmail: grant.providerEmail || "",
          providerPhone: grant.providerPhone || "",
          deadlineAt: grant.deadlineAt ? new Date(grant.deadlineAt).toISOString().slice(0, 16) : "",
          criteria: grant.criteria && grant.criteria.length > 0 ? grant.criteria : [""],
          process: grant.process && grant.process.length > 0 ? grant.process : [""],
        });
      } catch (error) {
        console.error("Failed to fetch grant:", error);
        toast.error("Failed to fetch grant");
        router.push("/manage/platform/resources");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchGrant();
  }, [grantId, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmation !== "confirm") {
      toast.error(`Please type "confirm" to ${isNew ? "create" : "update"} the grant`);
      return;
    }

    setLoading(true);
    try {
      // Clean the data properly
      const cleanData = {
        name: formData.name.trim(),
        provider: formData.provider.trim(),
        location: formData.location.trim() || undefined,
        description: formData.description.trim() || undefined,
        grant: formData.grant.trim() || undefined,
        criteria: formData.criteria.filter((c) => c.trim()).length > 0 ? formData.criteria.filter((c) => c.trim()) : [],
        process: formData.process.filter((p) => p.trim()).length > 0 ? formData.process.filter((p) => p.trim()) : [],
        websiteUrl: formData.websiteUrl.trim() || undefined,
        applyUrl: formData.applyUrl.trim() || undefined,
        providerEmail: formData.providerEmail.trim() || undefined,
        providerPhone: formData.providerPhone.trim() || undefined,
        deadlineAt: formData.deadlineAt || undefined,
        confirmation: "confirm" as const,
      };

      if (isNew) {
        await backend.resources.createGrant(cleanData);
        toast.success("Grant created successfully!");
      } else {
        await backend.resources.updateGrant(grantId, cleanData);
        toast.success("Grant updated successfully!");
      }

      router.push("/manage/platform/resources");
    } catch (error) {
      console.error(`${isNew ? "Create" : "Update"} error:`, error);
      toast.error(`Failed to ${isNew ? "create" : "update"} grant`);
    } finally {
      setLoading(false);
    }
  };

  const addCriterion = () => {
    setFormData((prev) => ({
      ...prev,
      criteria: [...prev.criteria, ""],
    }));
  };

  const removeCriterion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index),
    }));
  };

  const updateCriterion = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => (i === index ? value : c)),
    }));
  };

  const addProcessStep = () => {
    setFormData((prev) => ({
      ...prev,
      process: [...prev.process, ""],
    }));
  };

  const removeProcessStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      process: prev.process.filter((_, i) => i !== index),
    }));
  };

  const updateProcessStep = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      process: prev.process.map((p, i) => (i === index ? value : p)),
    }));
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader className="sm:justify-start">
        <Button variant={"outline"} size={"sm"} asChild>
          <Link
            href="/manage/platform/resources"
            aria-label="Back to Manage Resources"
            title="Back to Manage Resources"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <PageHeading>
          <PageTitle>{isNew ? "Add New Grant" : "Edit Grant"}</PageTitle>
          <PageDescription>{isNew ? "Create a grant opportunity." : "Update this grant opportunity."}</PageDescription>
        </PageHeading>
      </PageHeader>

      <PageContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="rounded-none border-x-0">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Grant Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider *</Label>
                  <Input
                    id="provider"
                    value={formData.provider}
                    onChange={(e) => setFormData((prev) => ({ ...prev, provider: e.target.value }))}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grant">Funding Amount</Label>
                  <Input
                    id="grant"
                    value={formData.grant}
                    onChange={(e) => setFormData((prev) => ({ ...prev, grant: e.target.value }))}
                    placeholder="e.g., Up to 50% funding"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  disabled={loading}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadlineAt">Deadline</Label>
                <Input
                  id="deadlineAt"
                  type="datetime-local"
                  value={formData.deadlineAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deadlineAt: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="rounded-none border-x-0">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applyUrl">Application URL</Label>
                  <Input
                    id="applyUrl"
                    type="url"
                    value={formData.applyUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, applyUrl: e.target.value }))}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="providerEmail">Contact Email</Label>
                  <Input
                    id="providerEmail"
                    type="email"
                    value={formData.providerEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, providerEmail: e.target.value }))}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="providerPhone">Contact Phone</Label>
                  <Input
                    id="providerPhone"
                    value={formData.providerPhone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, providerPhone: e.target.value }))}
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eligibility Criteria */}
          <Card className="rounded-none border-x-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Eligibility Criteria</CardTitle>
                <Button type="button" variant={"outline"} size={"sm"} onClick={addCriterion} disabled={loading}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Criterion
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.criteria.map((criterion, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    aria-label={`Eligibility criterion ${index + 1}`}
                    value={criterion}
                    onChange={(e) => updateCriterion(index, e.target.value)}
                    placeholder="Enter eligibility criterion"
                    disabled={loading}
                  />
                  {formData.criteria.length > 1 && (
                    <Button
                      aria-label={`Remove eligibility criterion ${index + 1}`}
                      type="button"
                      variant={"outline"}
                      size={"sm"}
                      onClick={() => removeCriterion(index)}
                      disabled={loading}
                    >
                      <XIcon className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Application Process */}
          <Card className="rounded-none border-x-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Application Process</CardTitle>
                <Button type="button" variant={"outline"} size={"sm"} onClick={addProcessStep} disabled={loading}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.process.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <div className="bg-primary text-primary-foreground flex h-10 w-8 flex-shrink-0 items-center justify-center rounded text-sm font-medium">
                    {index + 1}
                  </div>
                  <Input
                    aria-label={`Application process step ${index + 1}`}
                    value={step}
                    onChange={(e) => updateProcessStep(index, e.target.value)}
                    placeholder="Enter process step"
                    disabled={loading}
                  />
                  {formData.process.length > 1 && (
                    <Button
                      aria-label={`Remove application process step ${index + 1}`}
                      type="button"
                      variant={"outline"}
                      size={"sm"}
                      onClick={() => removeProcessStep(index)}
                      disabled={loading}
                    >
                      <XIcon className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Confirmation */}
          <Card className="rounded-none border-x-0">
            <CardHeader>
              <CardTitle>Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmation">
                  Type <strong>confirm</strong> to {isNew ? "create" : "update"} this grant:
                </Label>
                <Input
                  id="confirmation"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="confirm"
                  disabled={loading}
                  className={confirmation && confirmation !== "confirm" ? "border-destructive" : ""}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading || confirmation !== "confirm"}>
                  {loading ? `${isNew ? "Creating" : "Updating"}…` : `${isNew ? "Create" : "Update"} Grant`}
                </Button>
                <Button type="button" variant={"outline"} asChild>
                  <Link href="/manage/platform/resources">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </PageContent>
    </PageShell>
  );
}
