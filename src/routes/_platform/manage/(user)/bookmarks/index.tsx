import { createFileRoute } from "@tanstack/react-router";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import LikesTab from "#/routes/_platform/manage/(user)/bookmarks/-components/likes-tab";

export const Route = createFileRoute("/_platform/manage/(user)/bookmarks/")({ component: Page });

export default function Page() {
  return (
    <div>
      <Tabs className={"gap-0"} defaultValue={"likes"}>
        <TabsList className={"bg-sidebar w-full rounded-none border-b"}>
          <TabsTrigger value={"likes"}>Liked Services</TabsTrigger>
          <TabsTrigger value={"reviews"} disabled>
            My Reviews (Coming Soon)
          </TabsTrigger>
        </TabsList>
        <TabsContent value={"likes"}>
          <LikesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
