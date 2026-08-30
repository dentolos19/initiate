import { createFileRoute } from "@tanstack/react-router";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import ImageWrapper from "#/components/ui/wrappers/image";
import DocumentationTab from "#/routes/_platform/resources/-components/documentation-tab";
import GrantsTab from "#/routes/_platform/resources/-components/grants-tab";

export const Route = createFileRoute("/_platform/resources/")({ component: Page });

export default function Page() {
  return (
    <div className="mb-8">
      <div className="relative mb-8 h-64 sm:h-72 md:h-80 lg:h-96">
        <ImageWrapper
          className="size-full object-cover brightness-25"
          src="/assets/cta-light.jpg"
          alt="Resource Hub Banner"
          height={640}
          priority
          width={1600}
        />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="max-w-4xl text-center text-white">
            <h1 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl lg:text-6xl">Boosting Innovation</h1>
            <p className="mx-auto max-w-2xl px-4 text-center text-sm text-white/75 sm:text-base md:text-lg">
              Explore resources tailored for your industry.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6">
        <Tabs defaultValue="grants">
          <div className="mb-4 flex items-center justify-center">
            <TabsList className="grid w-full grid-cols-2 sm:flex sm:w-auto">
              <TabsTrigger value="grants" className="text-xs sm:text-sm">
                Grants
              </TabsTrigger>
              <TabsTrigger value="documentation" className="text-xs sm:text-sm">
                Documentation
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="grants">
            <GrantsTab />
          </TabsContent>
          <TabsContent value="documentation">
            <DocumentationTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
