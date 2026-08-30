import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "#/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "#/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import FormWrapper from "#/components/ui/wrappers/form";
import useBackend from "#/lib/backend/client";
import { OrderInvoice, OrderMilestone } from "#/lib/backend/connectors/orders";
import { currencySchema } from "#/lib/backend/schema";
import currencies from "#/lib/store/currencies";
import { notifyLoading } from "#/lib/utils";

const schema = z.object({
  currency: currencySchema,
  amount: z.number(),
  description: z.string().optional(),
  milestoneId: z.string().optional(),
});

export default function InvoiceDialog(props: {
  open: boolean;
  data: { orderId: string; invoice: OrderInvoice | null };
  onOpenChange: (open: boolean) => void;
  onCallback: () => void;
}) {
  const backend = useBackend();

  const mode = props.data.invoice ? "update" : "create";
  const editable =
    mode === "create" ||
    (props.data.invoice && (props.data.invoice.status === "draft" || props.data.invoice.status === "open"));

  const [milestones, setMilestones] = useState<OrderMilestone[]>([]);
  const form = useForm({ resolver: zodResolver(schema) });

  function loadMilestones() {
    backend.orders
      .getOrderMilestones(props.data.orderId)
      .then((milestones) => {
        setMilestones(milestones);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  function createSubmitHandler() {
    return form.handleSubmit(async (values) => {
      if (props.data.invoice) {
        notifyLoading(
          "Updating invoice…",
          backend.orders
            .updateOrderInvoice(props.data.invoice.id, {
              currency: values.currency,
              amount: values.amount * 100,
              description: values.description?.trim(),
              milestoneId: values.milestoneId === "none" ? null : values.milestoneId,
            })
            .then(() => {
              props.onCallback();
              props.onOpenChange(false);
            })
            .catch((error: Error) => {
              console.error(error);
              toast.error(error.message);
            }),
        );
      } else {
        notifyLoading(
          "Creating invoice…",
          backend.orders
            .createOrderInvoice(props.data.orderId, {
              currency: values.currency,
              amount: values.amount * 100,
              description: values.description?.trim(),
              milestoneId: values.milestoneId === "none" ? null : values.milestoneId,
            })
            .then(() => {
              props.onCallback();
              props.onOpenChange(false);
            })
            .catch((error: Error) => {
              console.error(error);
              toast.error(error.message);
            }),
        );
      }
    });
  }

  useEffect(() => {
    if (props.data.invoice) {
      form.reset({
        currency: props.data.invoice.currency || "sgd",
        amount: props.data.invoice.amount / 100,
        description: props.data.invoice.description || "",
        milestoneId: props.data.invoice.milestoneId || "none",
      });
    } else {
      form.reset({
        currency: "sgd",
        amount: 0,
        description: "",
        milestoneId: "none",
      });
    }
  }, [props.data.invoice]);

  useEffect(() => {
    if (props.open) {
      loadMilestones();
    }
  }, [props.open]);

  return (
    <FormWrapper form={form} onSubmit={createSubmitHandler()}>
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className={"sm:max-w-[425px]"}>
          <DialogHeader>
            <DialogTitle>{mode === "update" ? "Edit Invoice" : "New Invoice"}</DialogTitle>
          </DialogHeader>
          <div className={"space-y-4"}>
            {mode === "update" && (
              <FormItem>
                <FormLabel>ID</FormLabel>
                <FormControl>
                  <Input value={props.data.invoice?.id} disabled />
                </FormControl>
              </FormItem>
            )}
            <div className={"grid grid-cols-[auto_1fr] gap-2"}>
              {/* Currency */}
              <FormField
                control={form.control}
                name={"currency"}
                render={({ field, formState }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        disabled={formState.isSubmitting || !editable || mode === "update"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger disabled={formState.isSubmitting}>
                          <SelectValue placeholder={"Select currency…"} />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name={"amount"}
                render={({ field, formState }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type={"number"}
                        value={field.value}
                        disabled={formState.isSubmitting || !editable}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value)) {
                            field.onChange(value);
                          } else {
                            field.onChange(0);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Milestone */}
            <FormField
              control={form.control}
              name={"milestoneId"}
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Milestone (Optional)</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      disabled={formState.isSubmitting || !editable}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className={"w-full"}>
                        <SelectValue placeholder={"Select milestone…"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={"none"}>No milestone</SelectItem>
                        {milestones.map((milestone) => (
                          <SelectItem key={milestone.id} value={milestone.id}>
                            {milestone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      placeholder={"Enter description…"}
                      value={field.value}
                      disabled={formState.isSubmitting || !editable}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <DialogFooter>
            <Button type={"submit"} variant={"default"} onClick={createSubmitHandler()}>
              <SaveIcon />
              <span>{mode === "update" ? "Save" : "Create"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormWrapper>
  );
}
