"use client";

import { AwardIcon, EditIcon, FileTextIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import useBackend from "#/lib/backend/client";
import { ResourceDocumentation, ResourceGrant } from "#/lib/backend/schema";
import Link from "#/lib/router";
import DeleteDialog from "#/routes/-pages/(platform)/manage/platform/resources/_components/delete-dialog";

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
      toast.error("Failed to fetch resources");
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
        toast.success("Grant deleted successfully");
      } else {
        await backend.resources.deleteDocumentation(id, confirmation);
        setDocumentation(documentation.filter((d) => d.id !== id));
        toast.success("Documentation deleted successfully");
      }
      setDeleteItem(null);
      fetchData(); // Refresh data
    } catch (error) {
      toast.error("Failed to delete item");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Resources</h1>
          <p className="text-muted-foreground">Add and manage grants and documentation</p>
        </div>
      </div>

      <Tabs defaultValue="grants" className="space-y-6">
        <TabsList>
          <TabsTrigger value="grants">Grants ({grants.length})</TabsTrigger>
          <TabsTrigger value="documentation">Documentation ({documentation.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="grants" className="space-y-4">
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
              <Card key={grant.id} className="transition-shadow hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <AwardIcon className="text-primary h-6 w-6" />
                    <Badge variant="secondary">Grant</Badge>
                  </div>
                  <CardTitle className="line-clamp-2 text-lg">{grant.name}</CardTitle>
                  <p className="text-muted-foreground text-sm">{grant.provider}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground line-clamp-2 text-sm">{grant.description || "No description"}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      Created {new Date(grant.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <Button size={"sm"} variant={"outline"} asChild>
                        <Link href={`/manage/platform/resources/grants/${grant.id}`}>
                          <EditIcon className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
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
            <div className="border-muted rounded-lg border-2 border-dashed py-16 text-center">
              <AwardIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground mb-2 text-lg">No grants yet</p>
              <Button asChild>
                <Link href="/manage/platform/resources/grants/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Your First Grant
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
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
              <Card key={doc.id} className="transition-shadow hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <FileTextIcon className="text-primary h-6 w-6" />
                    <Badge variant="outline">Document</Badge>
                  </div>
                  <CardTitle className="line-clamp-2 text-lg">{doc.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground line-clamp-2 text-sm">{doc.description || "No description"}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      Created {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <Button size={"sm"} variant={"outline"} asChild>
                        <Link href={`/manage/platform/resources/documentation/${doc.id}`}>
                          <EditIcon className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
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
            <div className="border-muted rounded-lg border-2 border-dashed py-16 text-center">
              <FileTextIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground mb-2 text-lg">No documentation yet</p>
              <Button asChild>
                <Link href="/manage/platform/resources/documentation/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Your First Document
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      {deleteItem && <DeleteDialog item={deleteItem} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  );
}
