import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateBusinessSchema, type UpdateBusinessInput } from "@wealthify/shared";
import { useBusiness, useUpdateBusiness, useUpdateBusinessLogo } from "@/features/business/hooks";
import { useMe } from "@/features/auth/hooks";
import { uploadFile } from "@/features/uploads/api";
import { getErrorMessage } from "@/lib/errors";
import { PageHeader } from "@/components/common/PageHeader";
import { DropzoneUpload } from "@/components/common/DropzoneUpload";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BusinessSettingsPage() {
  const { data: me } = useMe();
  const business = useBusiness();
  const updateBusiness = useUpdateBusiness();
  const updateLogo = useUpdateBusinessLogo();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const canEdit = me?.user.role === "OWNER" || me?.user.role === "ADMIN";

  const form = useForm<UpdateBusinessInput>({
    resolver: zodResolver(updateBusinessSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (!business.data) return;
    form.reset({
      name: business.data.name,
      legalName: business.data.legalName ?? "",
      gstNumber: business.data.gstNumber ?? "",
      address: business.data.address ?? "",
      city: business.data.city ?? "",
      state: business.data.state ?? "",
      pincode: business.data.pincode ?? "",
      phone: business.data.phone ?? "",
      email: business.data.email ?? "",
      currency: business.data.currency,
      defaultGstRate: Number(business.data.defaultGstRate),
      invoicePrefix: business.data.invoicePrefix,
      quotationPrefix: business.data.quotationPrefix,
    });
  }, [business.data, form]);

  function onSubmit(values: UpdateBusinessInput) {
    updateBusiness.mutate(values, {
      onSuccess: () => toast.success("Business profile updated"),
      onError: (error) => toast.error(getErrorMessage(error, "Failed to update business")),
    });
  }

  async function handleLogoFile(file: File) {
    setIsUploadingLogo(true);
    try {
      const uploaded = await uploadFile("logos", file);
      updateLogo.mutate(
        { logoUrl: uploaded.url, logoPublicId: uploaded.publicId },
        {
          onSuccess: () => toast.success("Logo updated"),
          onError: (error) => toast.error(getErrorMessage(error, "Failed to save logo")),
        },
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Logo upload failed"));
    } finally {
      setIsUploadingLogo(false);
    }
  }

  if (business.isLoading) {
    return (
      <div>
        <PageHeader
          title="Business Settings"
          description="Your business profile, GST details, and invoice defaults."
        />
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Business Settings"
        description="Your business profile, GST details, and invoice defaults."
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {canEdit ? (
              <DropzoneUpload
                className="size-40"
                isUploading={isUploadingLogo}
                previewUrl={business.data?.logoUrl}
                onFileSelected={handleLogoFile}
                label="Drag a logo here, or click to browse"
              />
            ) : (
              <div className="flex size-40 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {business.data?.logoUrl && (
                  <img src={business.data.logoUrl} alt="Business logo" className="size-full object-cover" />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <fieldset disabled={!canEdit} className="space-y-4">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="legalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legal name</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST number</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="defaultGstRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default GST rate (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoicePrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice prefix</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quotationPrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quotation prefix</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {canEdit && (
                    <Button type="submit" disabled={updateBusiness.isPending}>
                      {updateBusiness.isPending ? "Saving…" : "Save changes"}
                    </Button>
                  )}
                </form>
              </fieldset>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
