"use client";

import { AlertTriangleIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";

interface DeleteDialogProps {
  item: {
    type: string;
    item: any;
  };
  onConfirm: (type: string, id: string, confirmation: string) => Promise<void>;
  onCancel: () => void;
}

export default function DeleteDialog({ item, onConfirm, onCancel }: DeleteDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (confirmation !== "delete") return;

    setLoading(true);
    try {
      await onConfirm(item.type, item.item.id, confirmation);
    } finally {
      setLoading(false);
    }
  };

  const isValid = confirmation === "delete";

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="text-destructive h-5 w-5" />
            Delete {item.type === "grant" ? "Grant" : "Documentation"}
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete <strong>{item.item.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <strong>delete</strong> to confirm:
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="delete"
              className={confirmation && !isValid ? "border-destructive" : ""}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!isValid || loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
