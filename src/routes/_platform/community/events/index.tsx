import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_platform/community/events/")({ component: Page });

export default function Page() {
  return <div className={"my-20 text-center"}>Coming Soon!</div>;
}
