"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import useBackend from "#/lib/backend/client";
import { ResourceDocumentation } from "#/lib/backend/schema";
import Link from "#/lib/router";
import { useParams, useRouter } from "#/lib/router";

export default function DocumentationPage() {
  const backend = useBackend();
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;
  const isNew = docId === "new";

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!isNew);
  const [confirmation, setConfirmation] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Fetch existing documentation data if editing
  useEffect(() => {
    if (isNew) {
      setFetchLoading(false);
      return;
    }

    const fetchDocumentation = async () => {
      try {
        const docs = await backend.resources.getDocumentation();
        const doc = docs.find((d: ResourceDocumentation) => d.id === docId);

        if (!doc) {
          toast.error("Documentation not found");
          router.push("/manage/platform/resources");
          return;
        }

        // Populate form with existing data
        setFormData({
          name: doc.name || "",
          description: doc.description || "",
        });
      } catch (error) {
        toast.error("Failed to fetch documentation");
        router.push("/manage/platform/resources");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchDocumentation();
  }, [docId, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmation !== "confirm") {
      toast.error(`Please type "confirm" to ${isNew ? "create" : "update"} the documentation`);
      return;
    }

    setLoading(true);
    try {
      const cleanData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        confirmation: "confirm" as const,
      };

      if (isNew) {
        await backend.resources.createDocumentation(cleanData);
        toast.success("Documentation created successfully!");
      } else {
        await backend.resources.updateDocumentation(docId, cleanData);
        toast.success("Documentation updated successfully!");
      }

      router.push("/manage/platform/resources");
    } catch (error) {
      console.error(`${isNew ? "Create" : "Update"} error:`, error);
      toast.error(`Failed to ${isNew ? "create" : "update"} documentation`);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant={"outline"} size={"sm"} asChild>
          <Link href="/manage/platform/resources">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isNew ? "Add New Documentation" : "Edit Documentation"}</h1>
          <p className="text-muted-foreground">
            {isNew ? "Create new documentation resource" : "Update documentation information"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Documentation Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Document Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                disabled={loading}
                required
              />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type <strong>confirm</strong> to {isNew ? "create" : "update"} this documentation:
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
                {loading ? `${isNew ? "Creating" : "Updating"}...` : `${isNew ? "Create" : "Update"} Documentation`}
              </Button>
              <Button type="button" variant={"outline"} asChild>
                <Link href="/manage/platform/resources">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
