import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "#/components/ui/dialog";
import useBackend from "#/lib/backend/client";
import { ResourceGrant } from "#/lib/backend/schema";

interface GrantAIAnalysisModalProps {
  grant: ResourceGrant;
}

export default function GrantAIAnalysisModal({ grant }: GrantAIAnalysisModalProps) {
  const backend = useBackend();
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const fetchAnalysis = async () => {
    if (!grant.id) return;

    setLoading(true);
    try {
      // Using the backend client instead of direct fetch
      const result = await backend.ai.getGrantSuitability(grant);
      setAnalysis(result.result || "No insights returned.");
    } catch (err) {
      console.error(err);
      setAnalysis("Failed to fetch AI analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    fetchAnalysis();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleOpen}>
          Ask AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>AI Grant Insights</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" />
          </div>
        ) : (
          <div className="prose max-w-none py-4 whitespace-pre-wrap">{analysis}</div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
