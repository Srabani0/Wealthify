import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@wealthify/shared";
import { useForgotPassword } from "@/features/auth/hooks";
import { getErrorMessage } from "@/lib/errors";
import { BrandMark } from "@/components/common/BrandMark";
import { AuthLayout, authFieldClassName } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    forgotPassword.mutate(values, {
      onError: (error) => toast.error(getErrorMessage(error, "Something went wrong")),
    });
  }

  return (
    <AuthLayout>
      <BrandMark variant="logo" className="mb-6 h-11 w-auto" />
      <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your account email and we'll send you a reset link.
      </p>

      {forgotPassword.isSuccess ? (
        <p className="mt-6 text-sm text-muted-foreground">
          If an account exists for that email, we've sent a password reset link. Check your inbox.
        </p>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@business.com"
                        className={authFieldClassName}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="h-11 w-full rounded-full" disabled={forgotPassword.isPending}>
              {forgotPassword.isPending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </Form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
