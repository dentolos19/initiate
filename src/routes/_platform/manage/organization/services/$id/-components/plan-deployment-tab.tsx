import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { schema } from "#/routes/_platform/manage/organization/services/$id/-components/plan-dialog";

export default function PlanDeploymentTab(_props: { form: UseFormReturn<z.infer<typeof schema>> }) {
  return <div className={"my-10 text-center"}>Coming Soon!</div>;
}
