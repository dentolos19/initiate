import { InfoIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import currencies from "#/lib/store/currencies";
import { schema } from "#/routes/-pages/(platform)/manage/organization/services/[id]/_components/plan-dialog";

export default function PlanPricingTab(props: { form: UseFormReturn<z.infer<typeof schema>> }) {
  const id = props.form.watch("id");

  return (
    <div className={"space-y-4"}>
      {/* Warning */}
      {!id && (
        <Alert>
          <InfoIcon />
          <AlertTitle>Tip</AlertTitle>
          <AlertDescription>Once you save this plan, you cannot change the pricing in the future.</AlertDescription>
        </Alert>
      )}

      {/* Type */}
      <FormField
        control={props.form.control}
        name={"type"}
        render={({ field, formState }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <FormControl>
              <Select value={field.value} disabled={formState.isSubmitting || !!id} onValueChange={field.onChange}>
                <SelectTrigger className={"w-full"} disabled={formState.isSubmitting}>
                  <SelectValue placeholder={"Select type..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={"one_time"}>One-Time</SelectItem>
                  {/* TODO: Implement recurring plans */}
                  <SelectItem value={"recurring"} disabled>
                    <span>Recurring</span>
                    <span className={"text-muted-foreground text-xs"}>Not Supported Yet</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className={"grid grid-cols-[auto_1fr] gap-2"}>
        {/* Currency */}
        <FormField
          control={props.form.control}
          name={"currency"}
          render={({ field, formState }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <Select value={field.value} disabled={formState.isSubmitting || !!id} onValueChange={field.onChange}>
                  <SelectTrigger disabled={formState.isSubmitting}>
                    <SelectValue placeholder={"Select currency..."} />
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
          control={props.form.control}
          name={"amount"}
          render={({ field, formState }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type={"number"}
                  value={field.value}
                  disabled={formState.isSubmitting || !!id}
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
    </div>
  );
}
