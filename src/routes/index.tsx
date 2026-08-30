import { createFileRoute } from "@tanstack/react-router";

import LegacyRoute from "#/components/legacy-route";

export const Route = createFileRoute("/")({ component: LegacyRoute });
