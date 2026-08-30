import { createFileRoute } from "@tanstack/react-router";
import { AwardIcon, EditIcon, FileTextIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { PageDescription, PageHeader, PageHeading, PageShell, PageTitle } from "#/components/ui/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import useBackend from "#/lib/backend/client";
import { ResourceDocumentation, ResourceGrant } from "#/lib/backend/schema";
import Link from "#/lib/router";
import DeleteDialog from "#/routes/_platform/manage/platform/resources/-components/delete-dialog";

export const Route = createFileRoute("/_platform/manage/platform/resources/")({ component: ResourcesPage });

export default function ResourcesPage() {
  const backend = useBackend();

  const [grants, setGrants] = useState<ResourceGrant[]>([]);
  const [documentation, setDocumentation] = useState<ResourceDocumentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteItem, setDeleteItem] = useState<{ type: string; item: any } | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      const [grantsData, docsData] = await Promise.all([
        backend.resources.getGrants(),
        backend.resources.getDocumentation(),
      ]);
      setGrants(grantsData);
      setDocumentation(docsData);
    } catch (error) {
      toast.error("Could not load resources. Try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle delete
  const handleDelete = async (type: string, id: string, confirmation: string) => {
    try {
      if (type === "grant") {
        await backend.resources.deleteGrant(id, confirmation);
        setGrants(grants.filter((g) => g.id !== id));
        toast.success("Grant deleted.");
      } else {
        await backend.resources.deleteDocumentation(id, confirmation);
        setDocumentation(documentation.filter((d) => d.id !== id));
        toast.success("Document deleted.");
      }
      setDeleteItem(null);
      fetchData(); // Refresh data
    } catch (error) {
      toast.error("Could not delete this resource. Try again.");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <PageShell>
      <PageHeader>
        <PageHeading>
          <PageTitle>Manage Resources</PageTitle>
          <PageDescription>Add and manage grants and documentation.</PageDescription>
        </PageHeading>
      </PageHeader>

      <Tabs defaultValue="grants" className="gap-0">
        <TabsList className="h-11 w-full justify-start rounded-none border-b bg-transparent px-4 sm:px-6">
          <TabsTrigger value="grants">Grants ({grants.length})</TabsTrigger>
          <TabsTrigger value="documentation">Documentation ({documentation.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="grants" className="m-0 space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Grants Management</h2>
            <Button asChild>
              <Link href="/manage/platform/resources/grants/new">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add New Grant
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {grants.map((grant) => (
              <Card key={grant.id} className="hover:bg-muted/30 shadow-none transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <AwardIcon className="text-primary h-6 w-6" />
                    <Badge variant="secondary">Grant</Badge>
                  </div>
                  <CardTitle className="line-clamp-2 text-lg">{grant.name}</CardTitle>
                  <p className="text-muted-foreground text-sm">{grant.provider}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground line-clamp-2 text-sm">{grant.description || "No description."}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      Created {new Date(grant.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <Button size={"sm"} variant={"outline"} asChild>
                        <Link href={`/manage/platform/resources/grants/${grant.id}`} aria-label={`Edit ${grant.name}`}>
                          <EditIcon className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        aria-label={`Delete ${grant.name}`}
                        onClick={() => setDeleteItem({ type: "grant", item: grant })}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {grants.length === 0 && (
            <div className="border-muted border-y border-dashed py-16 text-center">
              <AwardIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground mb-2 text-lg">No grants yet</p>
              <Button asChild>
                <Link href="/manage/platform/resources/grants/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Grant
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documentation" className="m-0 space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Documentation Management</h2>
            <Button asChild>
              <Link href="/manage/platform/resources/documentation/new">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add New Documentation
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documentation.map((doc) => (
              <Card key={doc.id} className="hover:bg-muted/30 shadow-none transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <FileTextIcon className="text-primary h-6 w-6" />
                    <Badge variant="outline">Document</Badge>
                  </div>
                  <CardTitle className="line-clamp-2 text-lg">{doc.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground line-clamp-2 text-sm">{doc.description || "No description."}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      Created {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <Button size={"sm"} variant={"outline"} asChild>
                        <Link
                          href={`/manage/platform/resources/documentation/${doc.id}`}
                          aria-label={`Edit ${doc.name}`}
                        >
                          <EditIcon className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        aria-label={`Delete ${doc.name}`}
                        onClick={() => setDeleteItem({ type: "documentation", item: doc })}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {documentation.length === 0 && (
            <div className="border-muted border-y border-dashed py-16 text-center">
              <FileTextIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground mb-2 text-lg">No documentation yet</p>
              <Button asChild>
                <Link href="/manage/platform/resources/documentation/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Document
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      {deleteItem && <DeleteDialog item={deleteItem} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </PageShell>
  );
}
