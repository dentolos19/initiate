"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import LikesTab from "#/routes/-pages/(platform)/manage/(user)/bookmarks/_components/likes-tab";

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
