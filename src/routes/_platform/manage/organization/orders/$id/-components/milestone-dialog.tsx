import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "#/components/ui/button";
import { Calendar } from "#/components/ui/calendar";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import useBackend from "#/lib/backend/client";
import { Order, OrderMilestone } from "#/lib/backend/connectors/orders";
import { cn } from "#/lib/utils";

const milestoneFormSchema = z.object({
  name: z.string().min(1, "Milestone name is required"),
  content: z.string().optional(),
  status: z.enum(["draft", "pending", "in_progress", "completed", "cancelled"]),
  dueAt: z.date().optional(),
});

type MilestoneFormData = z.infer<typeof milestoneFormSchema>;

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  orderId: string;
  milestone?: OrderMilestone | null;
  onSuccess: (milestone: OrderMilestone) => void;
}

export default function MilestoneDialog(props: MilestoneDialogProps) {
  const backend = useBackend();

  const form = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      name: "",
      content: "",
      status: "draft",
      dueAt: undefined,
    },
  });

  const isEditing = Boolean(props.milestone);

  async function onSubmit(data: MilestoneFormData) {
    try {
      const payload = {
        name: data.name,
        content: data.content || undefined,
        status: data.status,
        dueAt: data.dueAt ? data.dueAt.toISOString() : undefined,
      };

      let result: OrderMilestone;

      if (isEditing && props.milestone) {
        result = await backend.orders.updateOrderMilestone(props.orderId, props.milestone.id, payload);
        toast.success("Milestone updated successfully.");
      } else {
        result = await backend.orders.createOrderMilestone(props.orderId, payload);
        toast.success("Milestone created successfully.");
      }

      props.onSuccess(result);
      props.onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  }

  function handleCancel() {
    props.onOpenChange(false);
    form.reset();
  }

  // Update form data when milestone prop changes
  useEffect(() => {
    if (props.milestone) {
      form.reset({
        name: props.milestone.name,
        content: props.milestone.content || "",
        status: props.milestone.status as any,
        dueAt: props.milestone.dueAt ? new Date(props.milestone.dueAt) : undefined,
      });
    } else {
      form.reset({
        name: "",
        content: "",
        status: "draft",
        dueAt: undefined,
      });
    }
  }, [props.milestone, props.open]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Milestone" : "Create Milestone"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the milestone details below." : "Add a new milestone to track progress on this order."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={"space-y-4"}>
            <FormField
              control={form.control}
              name={"name"}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder={"Enter milestone name"} disabled={form.formState.isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={"content"}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={"Enter milestone description (optional)"}
                      disabled={form.formState.isSubmitting}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={"status"}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={
                      form.formState.isSubmitting || props.order.status === "draft" || props.order.status === "pending"
                    }
                  >
                    <FormControl>
                      <SelectTrigger className={"w-full"}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={"draft"}>Draft</SelectItem>
                      <SelectItem value={"pending"}>Pending</SelectItem>
                      <SelectItem value={"in_progress"}>In Progress</SelectItem>
                      <SelectItem value={"completed"}>Completed</SelectItem>
                      <SelectItem value={"cancelled"}>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={"dueAt"}
              render={({ field }) => (
                <FormItem className={"flex flex-col"}>
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          disabled={form.formState.isSubmitting}
                        >
                          {field.value ? (
                            field.value.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className={"ml-auto h-4 w-4 opacity-50"} />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className={"w-auto p-0"} align={"start"}>
                      <Calendar
                        mode={"single"}
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0)) || form.formState.isSubmitting
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type={"button"} variant={"outline"} onClick={handleCancel} disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
              <Button type={"submit"} disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
