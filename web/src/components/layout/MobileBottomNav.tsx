import { NavLink } from "react-router";
import { Boxes, LayoutDashboard, MoreHorizontal, ShoppingCart, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileNav } from "@/components/common/MobileNav";

const primaryTabs = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/expenses", label: "Expenses", icon: Wallet },
];

const tabClassName =
  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors";

export function MobileBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
      aria-label="Primary"
    >
      {primaryTabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => cn(tabClassName, isActive && "text-primary")}
        >
          <tab.icon className="size-5" />
          {tab.label}
        </NavLink>
      ))}
      <MobileNav
        trigger={
          <button type="button" className={tabClassName}>
            <MoreHorizontal className="size-5" />
            More
          </button>
        }
      />
    </nav>
  );
}
