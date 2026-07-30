import { createBrowserRouter, Navigate } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { CopilotPage } from "@/pages/copilot/CopilotPage";
import { BusinessSettingsPage } from "@/pages/settings/BusinessSettingsPage";
import { UsersPage } from "@/pages/settings/UsersPage";
import { CatalogPage } from "@/pages/catalog/CatalogPage";
import { ProductsListPage } from "@/pages/products/ProductsListPage";
import { ProductFormPage } from "@/pages/products/ProductFormPage";
import { InventoryPage } from "@/pages/inventory/InventoryPage";
import { PurchasesPage } from "@/pages/purchases/PurchasesPage";
import { OrdersPage } from "@/pages/orders/OrdersPage";
import { ExpensesPage } from "@/pages/expenses/ExpensesPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleGuard } from "./RoleGuard";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "copilot", element: <CopilotPage /> },
          { path: "catalog", element: <CatalogPage /> },
          { path: "products", element: <ProductsListPage /> },
          { path: "products/new", element: <ProductFormPage /> },
          { path: "products/:id/edit", element: <ProductFormPage /> },
          { path: "inventory", element: <InventoryPage /> },
          { path: "purchases", element: <PurchasesPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "expenses", element: <ExpensesPage /> },
          { path: "settings/business", element: <BusinessSettingsPage /> },
          {
            element: <RoleGuard allow={["OWNER", "ADMIN"]} />,
            children: [{ path: "settings/users", element: <UsersPage /> }],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
