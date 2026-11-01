import { Form as FormContainer } from "#/components/ui/form";
import { ComponentProps } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";

export default function FormWrapper<T extends FieldValues>({ form, children, ...props }: ComponentProps<"form"> & { form: UseFormReturn<T> }) {
  return (
    <FormContainer {...form}>
      <form {...props}>{children}</form>
    </FormContainer>
  );
}
