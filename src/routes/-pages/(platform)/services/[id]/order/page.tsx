"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, ShoppingCartIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import LoadingSpinner from "#/components/loading-spinner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Textarea } from "#/components/ui/textarea";
import Form from "#/components/ui/wrappers/form";
import Image from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import { Service, ServicePlan } from "#/lib/backend/schema";
import { useParams, useRouter, useSearchParams } from "#/lib/router";
import domains from "#/lib/store/domains";
import { formatPrice, getLabel } from "#/lib/utils";

const schema = z.object({
  instructions: z.string().optional(),
});

export default function Page() {
  const backend = useBackend();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params.id as string;
  const planId = searchParams.get("planId") || undefined;

  const [loading, setLoading] = useState<boolean>(true);
  const [service, setService] = useState<Service>();
  const [plan, setPlan] = useState<ServicePlan>();

  const form = useForm({ resolver: zodResolver(schema) });

  function createSubmitHandler() {
    return form.handleSubmit(async (values) => {
      if (!planId) return;
      await backend.service
        .orderServicePlan(id, planId, values)
        .then((result) => {
          toast.success("Order created. Continue with the demo payment.");
          router.push(`/manage/invoices/${result.invoice.id}`);
        })
        .catch((error: Error) => {
          console.error(error);
          toast.error(error.message);
        });
    });
  }

  function handleCancel() {
    router.push(`/services/${id}?planId=${planId}`);
  }

  useEffect(() => {
    if (!planId) return;
    Promise.all([
      backend.service.getService(id).then((service) => {
        setService(service);
      }),
      backend.service.getServicePlan(id, planId).then((plan) => {
        setPlan(plan);
      }),
    ])
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={"my-20"}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!planId) {
    return <div className={"my-20 text-center"}>No plan selected.</div>;
  }

  if (!service || !plan) {
    return <div className={"my-20 text-center"}>Service or plan not found.</div>;
  }

  return (
    <Form className={"container mx-auto flex gap-4 p-4 max-lg:flex-col"} form={form} onSubmit={createSubmitHandler()}>
      {/* Left */}
      <div className={"flex-1 space-y-4"}>
        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
            <CardDescription>This is what you are going to be purchasing.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={"bg-card flex border"}>
              <Image className={"aspect-square size-30"} src={service.imageUrl} alt={service.name} />
              <div className={"flex flex-1 flex-col justify-between p-4"}>
                <div>
                  <h2 className={"text-lg font-bold"}>{service.name}</h2>
                  <p className={"text-muted-foreground text-sm"}>{service.tagline || "No tagline available."}</p>
                </div>
                <div className={"flex gap-1"}>
                  {service.tags.map((tag) => (
                    <Badge key={tag} variant={"outline"}>
                      {getLabel(domains, tag, tag)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Service Configuration</CardTitle>
            <CardDescription>Configure your service options and review the pricing details.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name={"instructions"}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      value={field.value}
                      placeholder={"I want this service to have..."}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right */}
      <div className={"min-w-80"}>
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={"flex justify-between"}>
              <span className={"text-muted-foreground text-sm"}>{plan.name}</span>
              <span className={"text-sm font-bold"}>{plan.priceData ? formatPrice(plan.priceData) : "Unknown"}</span>
            </div>
          </CardContent>
          <CardFooter className={"flex-col gap-2"}>
            <Button className={"w-full"} type={"submit"} variant={"default"} disabled={form.formState.isSubmitting}>
              <ShoppingCartIcon />
              <span>Continue to demo payment</span>
            </Button>
            <Button
              className={"w-full"}
              type={"button"}
              variant={"outline"}
              disabled={form.formState.isSubmitting}
              onClick={handleCancel}
            >
              <ArrowLeftIcon />
              <span>Back To Service</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Form>
  );
}
