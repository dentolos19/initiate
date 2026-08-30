"use client";

import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import useBackend from "#/lib/backend/client";
import { Service, ServicePlan } from "#/lib/backend/schema";
import { formatPrice } from "#/lib/utils";
import PlanDialog from "#/routes/-pages/(platform)/manage/organization/services/[id]/_components/plan-dialog";
import Loading from "#/routes/-pages/loading";

export default function PlansTab(props: { data: Service }) {
  const backend = useBackend();

  const [loading, setLoading] = useState<boolean>(true);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan>();
  const [open, setOpen] = useState<boolean>(false);

  function loadPlans() {
    setLoading(true);
    backend.service
      .getServicePlans(props.data.id)
      .then((plans) => {
        setPlans(plans);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(loadPlans, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={"grid auto-rows-fr grid-cols-2 gap-4 p-4 md:grid-cols-4"}>
      {/* Plans */}
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={"bg-card hover:bg-card/80 cursor-pointer rounded-lg border p-4 transition"}
          onClick={() => {
            setSelectedPlan(plan);
            setOpen(true);
          }}
        >
          <div className={"mb-2 flex justify-between"}>
            <div className={"flex items-center gap-2"}>
              <h3 className={"font-medium"}>{plan.name}</h3>
              {plan.default && <Badge variant={"default"}>Default</Badge>}
            </div>
            <p className={"flex flex-col items-end text-sm"}>
              {plan.stripePriceData ? formatPrice(plan.stripePriceData) : "Unknown"}
            </p>
          </div>

          {/* Description */}
          <div className={"text-muted-foreground text-sm"}>{plan.description ?? "No description available."}</div>
        </div>
      ))}

      {/* Action */}
      <div
        className={"bg-card hover:bg-card/80 cursor-pointer rounded-lg border transition"}
        onClick={() => {
          setSelectedPlan(undefined);
          setOpen(true);
        }}
      >
        <div className={"my-20 flex flex-col items-center"}>
          <PlusIcon />
          <span>New Plan</span>
        </div>
      </div>

      {/* Dialogs */}
      <PlanDialog service={props.data} plan={selectedPlan} open={open} setOpen={setOpen} reloadCallback={loadPlans} />
    </div>
  );
}
