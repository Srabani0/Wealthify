import { Navigate, Outlet } from "react-router";
import type { RoleName } from "@wealthify/shared";
import { useMe } from "@/features/auth/hooks";

export function RoleGuard({ allow }: { allow: RoleName[] }) {
  const { data } = useMe();

  if (!data || !allow.includes(data.user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
