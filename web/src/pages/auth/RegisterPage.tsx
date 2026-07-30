import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import { Building2, Lock, Mail, User } from "lucide-react";
import { registerSchema, type RegisterInput } from "@wealthify/shared";
import { useRegisterBusiness } from "@/features/auth/hooks";
import { getErrorMessage } from "@/lib/errors";
import { BrandMark } from "@/components/common/BrandMark";
import { AuthLayout, authFieldClassName } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

export function RegisterPage() {
  const registerBusiness = useRegisterBusiness();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { businessName: "", ownerName: "", email: "", password: "" },
  });

  function onSubmit(values: RegisterInput) {
    registerBusiness.mutate(values, {
      onError: (error) => toast.error(getErrorMessage(error, "Registration failed")),
    });
  }

  return (
    <AuthLayout>
      <BrandMark variant="logo" className="mb-6 h-11 w-auto" />
      <h1 className="text-2xl font-semibold tracking-tight">Set up your business</h1>
      <p className="mt-1 text-sm text-muted-foreground">Create your Wealthify account in a minute.</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Sunrise General Store" className={authFieldClassName} {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ownerName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <User className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Jane Doe" className={authFieldClassName} {...field} />
                  </div>
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
          <Button type="submit" className="h-11 w-full rounded-full" disabled={registerBusiness.isPending}>
            {registerBusiness.isPending ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
