"use client";

import { FileTextIcon } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import useBackend from "#/lib/backend/client";
import { ResourceDocumentation } from "#/lib/backend/schema";

export default function DocumentationTab() {
  const backend = useBackend();
  const [docs, setDocs] = useState<ResourceDocumentation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await backend.resources.getDocumentation();
        setDocs(data);
      } catch (error) {
        console.error("Failed to fetch documentation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {docs.map((doc: ResourceDocumentation) => (
        <Card key={doc.id} className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <FileTextIcon className="text-primary h-8 w-8" />
              <Badge variant="outline">Document</Badge>
            </div>
            <CardTitle className="text-lg">{doc.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {doc.description && <p className="text-muted-foreground text-sm">{doc.description}</p>}

            <div className="flex items-center justify-between pt-2">
              <p className="text-muted-foreground text-xs">Added {new Date(doc.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      ))}

      {docs.length === 0 && (
        <div className="col-span-full py-16 text-center">
          <p className="text-muted-foreground text-lg">No documentation available yet.</p>
        </div>
      )}
    </div>
  );
}
