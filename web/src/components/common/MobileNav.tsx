import { useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { NavLink } from "react-router";
import { cn } from "@/lib/utils";
import { useMe } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/common/BrandMark";
import { navGroups } from "@/components/layout/navItems";

interface MobileNavProps {
  trigger?: ReactNode;
}

export function MobileNav({ trigger }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { data } = useMe();
  const role = data?.user.role;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        )}
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar shadow-elevated outline-none",
            "data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>
          <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-4">
            <BrandMark variant="logo" className="h-6 w-auto" />
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close menu">
                <X className="size-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <nav className="flex-1 space-y-5 overflow-y-auto p-3">
            {navGroups.map((group) => {
              const items = group.items.filter(
                (item) => !item.roles || (role ? item.roles.includes(role) : false),
              );
              if (items.length === 0) return null;

              return (
                <div key={group.label}>
                  <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-sidebar-foreground/50 uppercase">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            isActive &&
                              "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary",
                          )
                        }
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
