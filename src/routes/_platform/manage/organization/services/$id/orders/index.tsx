import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_platform/manage/organization/services/$id/orders/")({
  component: Page,
});

export default function Page() {
  return <div className={"my-20 text-center"}>Coming Soon!</div>;
}
