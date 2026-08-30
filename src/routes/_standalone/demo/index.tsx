import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "#/components/ui/button";
import Link from "#/lib/router";
import End from "#/routes/_standalone/demo/-components/end";
import Messaging from "#/routes/_standalone/demo/-components/messaging";
import Search from "#/routes/_standalone/demo/-components/search";
import Services from "#/routes/_standalone/demo/-components/services";
import Structure from "#/routes/_standalone/demo/-components/structure";

export const Route = createFileRoute("/_standalone/demo/")({ component: Page });

export default function Page() {
  return (
    <div className={"size-full"}>
      {/* Back Button */}
      <div className={"absolute inset-3"}>
        <Button variant={"ghost"} asChild>
          <Link href={"/"}>
            <ArrowLeftIcon />
            <span>Back</span>
          </Link>
        </Button>
      </div>

      {/* Animation Sections */}
      <Search text={"I want an AI solution for my business."} />
      <Services />
      <Messaging />
      <Structure />
      <End />
    </div>
  );
}
