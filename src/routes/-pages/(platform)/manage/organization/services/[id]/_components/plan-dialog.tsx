"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SelectValue } from "@radix-ui/react-select";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger } from "#/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Textarea } from "#/components/ui/textarea";
import useBackend from "#/lib/backend/client";
import { Service, ServicePlan } from "#/lib/backend/schema";
import PlanDeploymentTab from "#/routes/-pages/(platform)/manage/organization/services/[id]/_components/plan-deployment-tab";
import PlanFeaturesTab from "#/routes/-pages/(platform)/manage/organization/services/[id]/_components/plan-features-tab";
import PlanPricingTab from "#/routes/-pages/(platform)/manage/organization/services/[id]/_components/plan-pricing-tab";

export const schema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  status: z.string(),
  default: z.boolean(),
  type: z.string(),
  currency: z.string(),
  amount: z.number(),
});

export default function PlanDialog(props: {
  service: Service;
  plan?: ServicePlan;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  reloadCallback?: () => void;
}) {
  const backend = useBackend();
  const form = useForm({ resolver: zodResolver(schema) });

  function createSubmitHandler() {
    return form.handleSubmit(async (data) => {
      if (props.plan) {
        await backend.service
          .updateServicePlan(props.service.id, props.plan.id, data)
          .then(() => {
            toast.success("Plan saved successfully!");
          })
          .catch((error: Error) => {
            toast.error(error.message);
          });
      } else {
        await backend.service
          .createServicePlan(props.service.id, {
            ...data,
            data: {
              type: data.type,
              currency: data.currency,
              unit_amount: data.amount * 100,
            },
          })
          .then(() => {
            toast.success("Plan created successfully!");
          })
          .catch((error: Error) => {
            toast.error(error.message);
          });
      }

      props.reloadCallback?.();
      props.setOpen?.(false);
    });
  }

  function createDeleteHandler() {
    return async () => {
      if (!props.plan) return;
      await backend.service
        .deleteServicePlan(props.service.id, props.plan.id)
        .then(() => {
          toast.success("Plan deleted successfully!");
        })
        .catch((error: Error) => {
          toast.error(error.message);
        });

      props.reloadCallback?.();
      props.setOpen?.(false);
    };
  }

  function handleClose() {
    props.setOpen?.(false);
  }

  useEffect(() => {
    if (!props.open) return;
    form.reset({
      id: props.plan?.id,
      name: props.plan?.name,
      description: props.plan?.description ?? undefined,
      status: props.plan?.status ?? "active",
      default: props.plan?.default ?? false,
      type: props.plan?.priceData?.type ?? "one_time",
      currency: props.plan?.priceData?.currency ?? "sgd",
      ...(() => {
        switch (props.plan?.priceData?.type) {
          case "one_time": {
            return { amount: props.plan.priceData.unit_amount / 100 };
          }
          default: {
            return { amount: 5 };
          }
        }
      })(),
    });
  }, [props.open]);

  return (
    <Dialog open={props.open} onOpenChange={props.setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.plan ? "Edit Plan" : "New Plan"}</DialogTitle>
          <DialogDescription>
            {props.plan ? "Edit the plan details." : "Create a new plan for your service."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <div className={"space-y-4"}>
            {/* Name */}
            <FormField
              control={form.control}
              name={"name"}
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      value={field.value}
                      placeholder={"My Plan"}
                      onChange={field.onChange}
                      disabled={formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name={"description"}
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      value={field.value}
                      placeholder={"Expect something amazing!"}
                      onChange={field.onChange}
                      disabled={formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name={"status"}
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} disabled={formState.isSubmitting} onValueChange={field.onChange}>
                      <SelectTrigger className={"w-full"}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={"active"}>Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name={"default"}
              render={({ field, formState }) => (
                <FormItem className={"flex items-center"}>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={formState.isSubmitting}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Default</FormLabel>
                </FormItem>
              )}
            />

            <Tabs defaultValue={"pricing"}>
              <TabsList className={"w-full"}>
                <TabsTrigger value={"pricing"}>Pricing</TabsTrigger>
                <TabsTrigger value={"features"}>Features</TabsTrigger>
                <TabsTrigger value={"deployment"}>Deployment</TabsTrigger>
              </TabsList>

              <TabsContent value={"pricing"}>
                <PlanPricingTab form={form} />
              </TabsContent>

              <TabsContent value={"features"}>
                <PlanFeaturesTab form={form} />
              </TabsContent>

              <TabsContent value={"deployment"}>
                <PlanDeploymentTab form={form} />
              </TabsContent>
            </Tabs>
          </div>
        </Form>
        <DialogFooter>
          <Button variant={"outline"} onClick={handleClose}>
            Cancel
          </Button>
          {props.plan && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"destructive"}>Delete</Button>
              </PopoverTrigger>
              <PopoverContent className={"w-60"}>
                <h3 className={"mb-1 font-bold"}>Are you sure?</h3>
                <p className={"text-muted-foreground mb-2 text-sm"}>This action is permanent!</p>
                <Button variant={"destructive"} onClick={createDeleteHandler()}>
                  Delete
                </Button>
              </PopoverContent>
            </Popover>
          )}
          <Button variant={"default"} onClick={createSubmitHandler()}>
            {props.plan ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
