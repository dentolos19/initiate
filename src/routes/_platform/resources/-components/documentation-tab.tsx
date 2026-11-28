import { FileTextIcon } from "lucide-react";
import { useEffect, useState } from "react";

import LoadingSpinner from "#/components/loading-spinner";
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
  }, [backend.resources]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {docs.map((doc: ResourceDocumentation) => (
        <Card key={doc.id} className="transition-colors hover:bg-muted/30">
          <CardHeader>
            <div className="flex items-start justify-between">
              <FileTextIcon className="h-8 w-8 text-primary" />
              <Badge variant="outline">Document</Badge>
            </div>
            <CardTitle className="text-lg">{doc.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {doc.description && <p className="text-sm text-muted-foreground">{doc.description}</p>}

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">Added {new Date(doc.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      ))}

      {docs.length === 0 && (
        <div className="col-span-full py-16 text-center">
          <p className="text-lg text-muted-foreground">No documentation available yet.</p>
        </div>
      )}
    </div>
  );
}
