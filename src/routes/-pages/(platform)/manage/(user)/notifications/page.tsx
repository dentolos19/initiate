"use client";

import { ArchiveIcon, ArchiveRestoreIcon, BellIcon, InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import { Button } from "#/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import useBackend from "#/lib/backend/client";
import { Notification } from "#/lib/backend/connectors/notifications";
import { useStateUrl } from "#/lib/hooks";
import { formatDateTime } from "#/lib/utils";
import NotificationDialog from "#/routes/-pages/(platform)/manage/(user)/notifications/_components/notification-dialog";

export default function Page() {
  const backend = useBackend();

  const [tab, setTab] = useStateUrl("tab", "inbox");

  const [loading, setLoading] = useState<boolean>(true);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [unarchiving, setUnarchiving] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    backend.notifications
      .getUserNotifications(tab)
      .then((notifications) => {
        setNotifications(notifications);
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tab]);

  const handleArchiveNotification = (notificationId: string) => {
    setArchiving(notificationId);
    backend.notifications
      .archiveUserNotification(notificationId)
      .then(() => {
        // Remove notification from current list
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        // Clear selected notification if it was the archived one
        if (selectedNotification?.id === notificationId) {
          setSelectedNotification(null);
          setIsDialogOpen(false);
        }
        toast.success("Notification archived successfully");
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setArchiving(null);
      });
  };

  const handleUnarchiveNotification = (notificationId: string) => {
    setUnarchiving(notificationId);
    backend.notifications
      .unarchiveUserNotification(notificationId)
      .then(() => {
        // Remove notification from current list
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        // Clear selected notification if it was the unarchived one
        if (selectedNotification?.id === notificationId) {
          setSelectedNotification(null);
          setIsDialogOpen(false);
        }
        toast.success("Notification unarchived successfully");
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setUnarchiving(null);
      });
  };

  return (
    <div className={"flex size-full flex-col"}>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value);
          setSelectedNotification(null);
          setIsDialogOpen(false);
        }}
      >
        <TabsList className={"bg-sidebar w-full rounded-none border-b"}>
          <TabsTrigger value={"inbox"}>Inbox</TabsTrigger>
          <TabsTrigger value={"archived"}>Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && (
        <div className={"my-20"}>
          <LoadingSpinner />
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className={"text-muted-foreground my-20 text-center"}>
          <BellIcon className={"mx-auto mb-4 size-12"} />
          <h2 className={"mb-2 text-lg font-medium"}>No notifications yet</h2>
          <p className={"text-sm"}>
            You haven't received any notifications yet. Notifications will appear here when you have new updates or
            messages.
          </p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <>
          <div className={"flex-1"}>
            {/* Notification List */}
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={"hover:bg-muted flex cursor-pointer justify-between border-b p-4 transition"}
              >
                <div
                  className={"flex flex-1 cursor-pointer"}
                  onClick={() => {
                    setSelectedNotification(notification);
                    setIsDialogOpen(true);
                  }}
                >
                  <div className={"flex-1"}>
                    <div className={"flex items-center gap-2 font-medium"}>
                      <InfoIcon className={"size-5"} />
                      <h3>{notification.title}</h3>
                    </div>
                    <p className={"text-muted-foreground text-sm"}>{notification.description}</p>
                    <p className={"text-muted-foreground text-xs"}>{formatDateTime(notification.createdAt)}</p>
                  </div>
                </div>

                <div className={"flex items-center gap-2"}>
                  {tab === "inbox" && (
                    <Button
                      size={"sm"}
                      variant={"ghost"}
                      className={"h-8 w-8 p-0"}
                      disabled={archiving === notification.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveNotification(notification.id);
                      }}
                    >
                      <ArchiveIcon className={"size-4"} />
                    </Button>
                  )}
                  {tab === "archived" && (
                    <Button
                      size={"sm"}
                      variant={"ghost"}
                      className={"h-8 w-8 p-0"}
                      disabled={unarchiving === notification.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnarchiveNotification(notification.id);
                      }}
                    >
                      <ArchiveRestoreIcon className={"size-4"} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <NotificationDialog
            notification={selectedNotification}
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            tab={tab}
            archiving={archiving}
            unarchiving={unarchiving}
            onArchive={handleArchiveNotification}
            onUnarchive={handleUnarchiveNotification}
          />
        </>
      )}
    </div>
  );
}
