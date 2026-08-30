import { ArrowLeftIcon } from "lucide-react";

import { Button } from "#/components/ui/button";
import Link from "#/lib/router";
import End from "#/routes/-pages/(standalone)/demo/_components/end";
import Messaging from "#/routes/-pages/(standalone)/demo/_components/messaging";
import Search from "#/routes/-pages/(standalone)/demo/_components/search";
import Services from "#/routes/-pages/(standalone)/demo/_components/services";
import Structure from "#/routes/-pages/(standalone)/demo/_components/structure";

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
