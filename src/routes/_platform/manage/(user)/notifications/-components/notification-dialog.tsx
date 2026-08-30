import { ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";

import { Button } from "#/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "#/components/ui/dialog";
import { Notification } from "#/lib/backend/connectors/notifications";
import { formatDateTime } from "#/lib/utils";

interface NotificationDialogProps {
  notification: Notification | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tab: string;
  archiving: string | null;
  unarchiving: string | null;
  onArchive: (notificationId: string) => void;
  onUnarchive: (notificationId: string) => void;
}

export default function NotificationDialog({
  notification,
  isOpen,
  onOpenChange,
  tab,
  archiving,
  unarchiving,
  onArchive,
  onUnarchive,
}: NotificationDialogProps) {
  if (!notification) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={"max-h-[80vh] max-w-4xl overflow-y-auto"}>
        <DialogHeader>
          <div className={"flex items-center gap-2"}>
            <DialogTitle className={"text-2xl"}>{notification.title}</DialogTitle>
            {tab === "inbox" && (
              <Button
                size={"sm"}
                variant={"outline"}
                disabled={archiving === notification.id}
                onClick={() => onArchive(notification.id)}
              >
                <ArchiveIcon className={"mr-2 size-4"} />
                {archiving === notification.id ? "Archiving…" : "Archive"}
              </Button>
            )}
            {tab === "archived" && (
              <Button
                size={"sm"}
                variant={"outline"}
                disabled={unarchiving === notification.id}
                onClick={() => onUnarchive(notification.id)}
              >
                <ArchiveRestoreIcon className={"mr-2 size-4"} />
                {unarchiving === notification.id ? "Unarchiving…" : "Unarchive"}
              </Button>
            )}
          </div>
          <DialogDescription>{notification.description}</DialogDescription>
          <p className={"text-muted-foreground text-xs"}>{formatDateTime(notification.createdAt)}</p>
        </DialogHeader>

        <div
          className={"prose dark:prose-invert max-w-none"}
          dangerouslySetInnerHTML={{ __html: notification.content || "" }}
        />
      </DialogContent>
    </Dialog>
  );
}
