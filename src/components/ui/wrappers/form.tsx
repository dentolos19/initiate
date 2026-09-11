import { Form as FormContainer } from "#/components/ui/form";
import { ComponentProps } from "react";
import { UseFormReturn } from "react-hook-form";

export default function FormWrapper(props: ComponentProps<"form"> & { form: UseFormReturn<any> }) {
  return (
    <FormContainer {...props.form}>
      <form {...props}>{props.children}</form>
    </FormContainer>
  );
}
