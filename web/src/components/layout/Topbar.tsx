import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { Bell, ChevronRight, LogOut, Plus, Search, User as UserIcon } from "lucide-react";
import { useLogout, useMe } from "@/features/auth/hooks";
import { BrandMark } from "@/components/common/BrandMark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/common/ThemeToggle";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  catalog: "Categories & Brands",
  products: "Products",
  new: "New",
  edit: "Edit",
  inventory: "Inventory",
  purchases: "Purchases",
  orders: "Orders",
  expenses: "Expenses",
  settings: "Settings",
  business: "Business Settings",
  users: "Users",
};

const quickActions = [
  { label: "New product", to: "/products/new" },
  { label: "New order", to: "/orders" },
  { label: "New purchase", to: "/purchases" },
  { label: "New expense", to: "/expenses" },
];

function getInitials(name?: string) {
  if (!name) return null;
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Breadcrumbs() {
  const location = useLocation();
  const crumbs = location.pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => ROUTE_LABELS[segment])
    .filter((label): label is string => Boolean(label));

  if (crumbs.length === 0) return null;

  return (
    <div className="hidden items-center gap-1.5 text-sm text-muted-foreground md:flex">
      {crumbs.map((label, i) => (
        <span key={`${label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3.5" />}
          <span className={i === crumbs.length - 1 ? "font-medium text-foreground" : ""}>{label}</span>
        </span>
      ))}
    </div>
  );
}

export function Topbar() {
  const { data } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const initials = getInitials(data?.user.name);
  const [searchValue, setSearchValue] = useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchValue.trim()) toast.info("Search will be available soon.");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-card/80 px-4 backdrop-blur-md sm:px-6">
      <BrandMark variant="logo" className="h-6 w-auto md:hidden" />
      <Breadcrumbs />

      <div className="flex flex-1 items-center justify-end gap-1.5">
        <form onSubmit={handleSearchSubmit} className="hidden max-w-56 flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search…"
              className="h-8 w-full rounded-md border bg-background pl-8 pr-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Quick actions">
              <Plus className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickActions.map((action) => (
              <DropdownMenuItem key={action.label} onClick={() => navigate(action.to)}>
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications yet</p>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials ?? <UserIcon className="size-4" />}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{data?.user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{data?.user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings/business">Business settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
