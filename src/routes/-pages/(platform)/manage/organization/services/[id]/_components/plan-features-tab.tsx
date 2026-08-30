import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { schema } from "#/routes/-pages/(platform)/manage/organization/services/[id]/_components/plan-dialog";

export default function PlanFeaturesTab(props: { form: UseFormReturn<z.infer<typeof schema>> }) {
  return <div className={"my-10 text-center"}>Coming Soon!</div>;
}
