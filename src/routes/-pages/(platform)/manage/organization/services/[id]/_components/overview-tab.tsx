"use client";

import { EyeIcon, InfoIcon, SaveIcon } from "lucide-react";
import { ChangeEvent } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { MultiSelect } from "#/components/ui/custom/multi-select";
import { RichEditor } from "#/components/ui/custom/rich";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import ImageWrapper from "#/components/ui/wrappers/image";
import useBackend from "#/lib/backend/client";
import Link from "#/lib/router";
import domains from "#/lib/store/domains";
import serviceStatus from "#/lib/store/service-status";
import { FormController } from "#/routes/-pages/(platform)/manage/organization/services/[id]/form";

export default function OverviewTab(props: { form: FormController }) {
  const backend = useBackend();

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    backend.assets
      .uploadFile(file)
      .then((data) => {
        props.form.setValue("imageUrl", "/assets/" + data.id);
        toast.success("Image updated successfully!");
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  function handleBannerUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    backend.assets
      .uploadFile(file)
      .then((data) => {
        props.form.setValue("bannerUrl", "/assets/" + data.id);
        toast.success("Banner updated successfully!");
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      });
  }

  const id = props.form.watch("id");

  return (
    <div className={"container mx-auto max-w-4xl space-y-6 p-4"}>
      {!id && (
        <Alert>
          <InfoIcon />
          <AlertTitle>Tip</AlertTitle>
          <AlertDescription>You need to save the service first before you can create plans for it.</AlertDescription>
        </Alert>
      )}

      {/* Settings */}
      <div className={"space-y-4"}>
        <div className={"flex gap-4 max-sm:flex-col"}>
          {/* Icon */}
          <FormField
            control={props.form.control}
            name={"imageUrl"}
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <FormControl>
                  <label className={"w-max cursor-pointer"}>
                    {/* File Input */}
                    <input
                      className={"hidden"}
                      type={"file"}
                      disabled={formState.isSubmitting}
                      onChange={handleImageUpload}
                    />

                    {/* Visual Representation */}
                    <ImageWrapper className={"size-40 rounded-lg object-cover"} src={field.value} alt={"Icon"} />
                  </label>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Banner */}
          <FormField
            control={props.form.control}
            name={"bannerUrl"}
            render={({ field, formState }) => (
              <FormItem>
                <FormLabel>Banner</FormLabel>
                <FormControl>
                  <label className={"w-max cursor-pointer"}>
                    {/* File Input */}
                    <input
                      className={"hidden"}
                      type={"file"}
                      disabled={formState.isSubmitting}
                      onChange={handleBannerUpload}
                    />

                    {/* Visual Representation */}
                    <ImageWrapper className={"h-40 w-auto rounded-lg"} src={field.value} alt={"Banner"} />
                  </label>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Name */}
        <FormField
          control={props.form.control}
          name={"name"}
          render={({ field, formState }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  value={field.value}
                  placeholder={"My Service"}
                  disabled={formState.isSubmitting}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type */}
        {/* <FormField
          control={props.form.control}
          name={"type"}
          render={({ field, formState }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Select value={field.value} disabled={formState.isSubmitting} onValueChange={field.onChange}>
                  <SelectTrigger className={"w-full"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        {/* Status */}
        <FormField
          control={props.form.control}
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
                    {serviceStatus.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tagline */}
        <FormField
          control={props.form.control}
          name={"tagline"}
          render={({ field, formState }) => (
            <FormItem>
              <FormLabel>Tagline</FormLabel>
              <FormControl>
                <Input
                  value={field.value}
                  placeholder={"Expect something amazing!"}
                  disabled={formState.isSubmitting}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={props.form.control}
          name={"tags"}
          render={({ field, formState }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <MultiSelect
                  defaultValue={field.value}
                  placeholder={"Select tags..."}
                  options={domains}
                  disabled={formState.isSubmitting}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={props.form.control}
          name={"description"}
          render={({ field, formState }) => (
            <FormItem>
              <FormControl>
                <RichEditor value={field.value} disabled={formState.isSubmitting} onValueChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Actions */}
      <div className={"flex gap-2"}>
        <Button type={"submit"} variant={"default"}>
          <SaveIcon />
          <span>Save</span>
        </Button>
        {id && (
          <Button type={"button"} variant={"outline"} asChild>
            <Link href={`/services/${id}`} target={"_blank"}>
              <EyeIcon />
              <span>Preview</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
