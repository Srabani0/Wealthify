import { useLocation } from "react-router";
import { PageTransition } from "@/components/motion/PageTransition";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileBottomNav } from "./MobileBottomNav";
import { CopilotSidebar } from "@/features/copilot/components/CopilotSidebar";
import { CopilotFloatingButton } from "@/features/copilot/components/CopilotFloatingButton";

export function AppShell() {
  const location = useLocation();
  const isCopilotRoute = location.pathname === "/copilot";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-w-0 flex-1 bg-muted/30 p-4 pb-20 sm:p-6 md:pb-6">
          <PageTransition />
        </main>
        <MobileBottomNav />
      </div>
      {!isCopilotRoute && (
        <>
          <CopilotSidebar />
          <CopilotFloatingButton />
        </>
      )}
    </div>
  );
}
