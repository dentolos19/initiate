import { createFileRoute } from "@tanstack/react-router";
import { ExternalLinkIcon } from "lucide-react";
import { useEffect } from "react";

import { Button } from "#/components/ui/button";

const termsUrl = "https://docs.google.com/document/d/1J7slDBSx0vYs_axneAgskUaDcfYK0ZgM3DMXBcqptyA/edit?usp=sharing";

export const Route = createFileRoute("/_routes/terms/")({ component: Page });

export default function Page() {
  useEffect(() => {
    window.location.replace(termsUrl);
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Opening Terms of Service</h1>
        <p className="text-muted-foreground">Use the link below if the document does not open automatically.</p>
        <Button asChild>
          <a href={termsUrl} rel="noreferrer" target="_blank">
            View Terms of Service
            <ExternalLinkIcon />
          </a>
        </Button>
      </div>
    </main>
  );
}
