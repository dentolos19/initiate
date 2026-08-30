import { SparklesIcon } from "lucide-react";

import { Input } from "#/components/ui/input";
import { AuroraText } from "#/components/ui/magic/aurora-text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import ImageWrapper from "#/components/ui/wrappers/image";
import Link from "#/lib/router";
import DocumentationTab from "#/routes/-pages/(platform)/resources/_components/documentation-tab";
import GrantAIAnalysisModal from "#/routes/-pages/(platform)/resources/_components/GrantAIAnalysisModal";
import GrantsTab from "#/routes/-pages/(platform)/resources/_components/grants-tab";

export default function Page() {
  return (
    <div className="mb-8">
      {/* Enhanced Hero Section */}
      <div className="relative mb-8 h-64 sm:h-72 md:h-80 lg:h-96">
        <ImageWrapper
          className="size-full object-cover brightness-25"
          src="/assets/cta-light.jpg"
          alt="Resource Hub Banner"
        />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="max-w-4xl text-center text-white">
            <h1 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl lg:text-6xl">
              Boosting <AuroraText colors={["#00f5ff", "#40e0d0", "#8b5cf6", "#06b6d4"]}>Innovation</AuroraText>
            </h1>
            <p className="mx-auto max-w-2xl px-4 text-center text-sm text-gray-400 sm:text-base md:text-lg">
              Explore resources tailored for your industry
            </p>
          </div>
        </div>
      </div>

      {/* Content with proper container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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

        {/*
        <div className="flex space-x-2">
          <Link href={`/resources/grants/${grant.id}`}>More Info</Link>
          <GrantAIAnalysisModal grantId={grant.id} />
        </div>
        */}
      </div>
    </div>
  );
}
