"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Form } from "#/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import useBackend from "#/lib/backend/client";
import { Service } from "#/lib/backend/schema";
import { useSession } from "#/lib/providers/session";
import { useParams, useRouter } from "#/lib/router";
import OverviewTab from "#/routes/-pages/(platform)/manage/organization/services/[id]/_components/overview-tab";
import PlansTab from "#/routes/-pages/(platform)/manage/organization/services/[id]/_components/plans-tab";
import { formSchema, FormValues } from "#/routes/-pages/(platform)/manage/organization/services/[id]/form";
import Loading from "#/routes/-pages/loading";

export default function Page() {
  const backend = useBackend();
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;
  const mode = id === "create" ? "create" : "edit";

  const { organization } = useSession();
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const [loading, setLoading] = useState<boolean>(true);
  const [service, setService] = useState<Service>();

  function createSaveHandler() {
    return form.handleSubmit(async (values: FormValues) => {
      if (mode === "create") {
        await backend.service
          .createService(organization!.id!, values)
          .then((service) => {
            toast.success("Service created successfully.");
            router.replace(`/manage/organization/services/${service.id}`);
          })
          .catch((error: Error) => {
            console.error(error);
            toast.error(error.message);
          });
      } else {
        await backend.service
          .updateService(id, values)
          .then(() => {
            toast.success("Service saved successfully.");
          })
          .catch((error: Error) => {
            console.error(error);
            toast.error(error.message);
          });
      }
    });
  }

  useEffect(() => {
    if (mode === "create") {
      form.reset({
        type: "other",
        status: "draft",
      });
      setLoading(false);
      return;
    }

    backend.service
      .getService(id)
      .then((data) => {
        setService(data);
        form.reset({
          id: data.id,
          imageUrl: data.imageUrl ?? undefined,
          bannerUrl: data.bannerUrl ?? undefined,
          name: data.name,
          type: data.type,
          status: data.status,
          tagline: data.tagline ?? undefined,
          description: data.description ?? undefined,
          tags: data.tags ?? [],
        });
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  return (
    <Form {...form}>
      <form onSubmit={createSaveHandler()}>
        <Tabs className={"gap-0"} defaultValue={"overview"}>
          <TabsList className={"bg-sidebar w-full rounded-none border-b"}>
            <TabsTrigger value={"overview"}>Overview</TabsTrigger>
            <TabsTrigger value={"plans"} disabled={mode === "create"}>
              Plans
            </TabsTrigger>
          </TabsList>
          <TabsContent value={"overview"}>
            <OverviewTab form={form} />
          </TabsContent>
          <TabsContent value={"plans"}>
            <PlansTab data={service!} />
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
