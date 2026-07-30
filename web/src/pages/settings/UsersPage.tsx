import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Users as UsersIcon } from "lucide-react";
import { createUserSchema, type CreateUserInput } from "@wealthify/shared";
import { useCreateUser, useUpdateUser, useUsers } from "@/features/users/hooks";
import { getErrorMessage } from "@/lib/errors";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const createUser = useCreateUser();

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "STAFF" },
  });

  function onSubmit(values: CreateUserInput) {
    createUser.mutate(values, {
      onSuccess: () => {
        toast.success("User added");
        form.reset();
        setOpen(false);
      },
      onError: (error) => toast.error(getErrorMessage(error, "Failed to add user")),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Add user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a user</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input type="email" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Adding…" : "Add user"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersPage() {
  const users = useUsers();
  const updateUser = useUpdateUser();
  const [pendingToggle, setPendingToggle] = useState<{ id: string; name: string; isActive: boolean } | null>(
    null,
  );

  function confirmToggle() {
    if (!pendingToggle) return;
    updateUser.mutate(
      { id: pendingToggle.id, input: { isActive: !pendingToggle.isActive } },
      {
        onSuccess: () => {
          toast.success(pendingToggle.isActive ? "User deactivated" : "User activated");
          setPendingToggle(null);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Failed to update user")),
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="People who can access your business account."
        action={<AddUserDialog />}
      />

      {users.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : users.data && users.data.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No additional users yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.data?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "success" : "outline"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {user.role !== "OWNER" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPendingToggle({ id: user.id, name: user.name, isActive: user.isActive })
                      }
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={!!pendingToggle}
        onOpenChange={(open) => !open && setPendingToggle(null)}
        title={pendingToggle?.isActive ? "Deactivate user?" : "Activate user?"}
        description={
          pendingToggle?.isActive
            ? `${pendingToggle.name} will no longer be able to log in.`
            : `${pendingToggle?.name} will regain access to log in.`
        }
        confirmLabel={pendingToggle?.isActive ? "Deactivate" : "Activate"}
        destructive={pendingToggle?.isActive}
        isLoading={updateUser.isPending}
        onConfirm={confirmToggle}
      />
    </div>
  );
}
