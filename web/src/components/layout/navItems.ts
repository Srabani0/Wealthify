import {
  Boxes,
  Building2,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Tags,
  Users,
  Wallet,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { RoleName } from "@wealthify/shared";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: RoleName[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/copilot", label: "AI Copilot", icon: Sparkles },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/products", label: "Products", icon: Package },
      { to: "/inventory", label: "Inventory", icon: Boxes },
      { to: "/catalog", label: "Categories & Brands", icon: Tags },
    ],
  },
  {
    label: "Sales",
    items: [
      { to: "/orders", label: "Orders", icon: ShoppingCart },
      { to: "/purchases", label: "Purchases", icon: Receipt },
    ],
  },
  {
    label: "Finance",
    items: [{ to: "/expenses", label: "Expenses", icon: Wallet }],
  },
  {
    label: "Settings",
    items: [
      { to: "/settings/business", label: "Business Settings", icon: Building2 },
      { to: "/settings/users", label: "Users", icon: Users, roles: ["OWNER", "ADMIN"] },
    ],
  },
];
