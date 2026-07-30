import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Lock } from "lucide-react";
import { resetPasswordSchema } from "@wealthify/shared";
import { useResetPassword } from "@/features/auth/hooks";
import { getErrorMessage } from "@/lib/errors";
import { BrandMark } from "@/components/common/BrandMark";
import { AuthLayout, authFieldClassName } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const resetPasswordFormSchema = resetPasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const resetPassword = useResetPassword();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  function onSubmit(values: ResetPasswordFormValues) {
    resetPassword.mutate(
      { token: values.token, password: values.password },
      {
        onSuccess: () => toast.success("Password reset — log in with your new password"),
        onError: (error) =>
          toast.error(getErrorMessage(error, "This reset link is invalid or has expired")),
      },
    );
  }

  if (!token) {
    return (
      <AuthLayout>
        <BrandMark variant="logo" className="mb-6 h-11 w-auto" />
        <h1 className="text-2xl font-semibold tracking-tight">Invalid reset link</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This password reset link is missing its token. Request a new one.
        </p>
        <Link
          to="/forgot-password"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          Request a new reset link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <BrandMark variant="logo" className="mb-6 h-11 w-auto" />
      <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                    <PasswordInput
                      placeholder="At least 8 characters"
                      className={authFieldClassName}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                    <PasswordInput
                      placeholder="Confirm password"
                      className={authFieldClassName}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="h-11 w-full rounded-full" disabled={resetPassword.isPending}>
            {resetPassword.isPending ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
