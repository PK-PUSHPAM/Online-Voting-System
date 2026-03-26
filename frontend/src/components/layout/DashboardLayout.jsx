import { Outlet } from "react-router-dom";
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import Topbar from "./Topbar";

export default function DashboardLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);

  return (
    <div className="admin-shell">
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isDesktopCollapsed={isDesktopSidebarCollapsed}
        onDesktopToggle={() => setIsDesktopSidebarCollapsed((prev) => !prev)}
      />

      <div
        className={[
          "admin-shell__main",
          isDesktopSidebarCollapsed ? "admin-shell__main--expanded" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Topbar onOpenSidebar={() => setIsMobileSidebarOpen(true)} />

        <main className="admin-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
