import { Navigate, Outlet } from "react-router";
import { useMe } from "@/features/auth/hooks";
import { getToken } from "@/lib/auth";
import { LoadingScreen } from "@/components/common/LoadingScreen";

export function ProtectedRoute() {
  const token = getToken();
  const { data, isLoading, isError } = useMe();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError || !data) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
