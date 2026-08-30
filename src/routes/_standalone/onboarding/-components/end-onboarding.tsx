import { ArrowRightIcon, ScanEyeIcon, UserIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import Link from "#/lib/router";

export default function EndOnboarding() {
  return (
    <Card className={"w-100"}>
      <CardHeader>
        <CardTitle>All done!</CardTitle>
        <CardDescription>Thank you for joining us! Keep initiating!</CardDescription>
      </CardHeader>
      <CardContent className={"space-y-4"}>
        {/* Explore */}
        <Link
          className={"hover:border-primary flex w-full justify-between rounded-lg border p-3 text-left transition"}
          href={"/market"}
        >
          <div>
            <div className={"mb-1 flex items-center gap-2"}>
              <ScanEyeIcon className={"size-4"} />
              <h2>Explore For Services</h2>
            </div>
            <p className={"text-muted-foreground text-xs"}>Discover and connect with service providers in your area.</p>
          </div>
          <ArrowRightIcon />
        </Link>

        {/* Connect */}
        <Link
          className={"hover:border-primary flex w-full justify-between rounded-lg border p-3 text-left transition"}
          href={"/community"}
        >
          <div>
            <div className={"mb-1 flex items-center gap-2"}>
              <UserIcon className={"size-4"} />
              <h2>Talk With The Community</h2>
            </div>
            <p className={"text-muted-foreground text-xs"}>
              Connect with other users, share experiences, get advice, and build meaningful relationships within our
              community.
            </p>
          </div>
          <ArrowRightIcon />
        </Link>

        {/* Publish */}
        <Link
          className={"hover:border-primary flex w-full justify-between rounded-lg border p-3 text-left transition"}
          href={"/manage/organization/new"}
        >
          <div>
            <div className={"mb-1 flex items-center gap-2"}>
              <ScanEyeIcon className={"size-4"} />
              <h2>Publish Your Services</h2>
            </div>
            <p className={"text-muted-foreground text-xs"}>
              Share your services with the community and grow your network.
            </p>
          </div>
          <ArrowRightIcon />
        </Link>
      </CardContent>
    </Card>
  );
}
