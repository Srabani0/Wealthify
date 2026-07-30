import { NavLink } from "react-router";
import { motion } from "framer-motion";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMe, useLogout } from "@/features/auth/hooks";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { BrandMark } from "@/components/common/BrandMark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { navGroups } from "./navItems";

function getInitials(name?: string) {
  if (!name) return null;
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Sidebar() {
  const { data } = useMe();
  const logout = useLogout();
  const role = data?.user.role;
  const { collapsed, toggle } = useSidebarCollapsed();
  const reducedMotion = usePrefersReducedMotion();
  const initials = getInitials(data?.user.name);

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 264 }}
      transition={{ duration: reducedMotion ? 0 : 0.22, ease: "easeOut" }}
      className="sticky top-0 hidden h-screen shrink-0 p-3 md:block"
    >
      <div className="flex h-full flex-col rounded-2xl border border-sidebar-border bg-sidebar shadow-soft">
        <div className={cn("flex h-14 shrink-0 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "gap-2 px-4")}>
          <BrandMark variant={collapsed ? "icon" : "logo"} className={collapsed ? "size-6" : "h-6 w-auto"} />
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {navGroups.map((group) => {
            const items = group.items.filter(
              (item) => !item.roles || (role ? item.roles.includes(role) : false),
            );
            if (items.length === 0) return null;

            return (
              <div key={group.label}>
                {!collapsed && (
                  <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-sidebar-foreground/50 uppercase">
                    {group.label}
                  </p>
                )}
                <div className="space-y-1">
                  {items.map((item) => {
                    const link = (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            collapsed && "justify-center px-0",
                            isActive &&
                              "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary",
                          )
                        }
                      >
                        <item.icon className="size-4 shrink-0" />
                        {!collapsed && item.label}
                      </NavLink>
                    );

                    if (!collapsed) return link;

                    return (
                      <Tooltip key={item.to}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border p-3">
          {!collapsed && (
            <div className="mb-2 rounded-lg bg-sidebar-accent/40 px-3 py-2">
              <p className="truncate text-xs font-medium text-sidebar-foreground/70">{data?.business.name}</p>
            </div>
          )}

          <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-between")}>
            <div className={cn("flex min-w-0 items-center gap-2", collapsed && "flex-col")}>
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {initials ?? data?.user.name?.[0]}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-sidebar-foreground">{data?.user.name}</p>
                  <p className="truncate text-[11px] text-sidebar-foreground/50">{data?.user.role}</p>
                </div>
              )}
            </div>

            <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => logout()}
                    aria-label="Log out"
                    className="rounded-lg p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <LogOut className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? "right" : "top"}>Log out</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggle}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="rounded-lg p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? "right" : "top"}>
                  {collapsed ? "Expand" : "Collapse"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
