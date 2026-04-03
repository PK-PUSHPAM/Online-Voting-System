import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import Topbar from "./Topbar";

export default function DashboardLayout() {
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncSidebarMode = () => {
      if (window.innerWidth < 1200) {
        setIsDesktopSidebarCollapsed(false);
      }
    };

    syncSidebarMode();
    window.addEventListener("resize", syncSidebarMode);

    return () => window.removeEventListener("resize", syncSidebarMode);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;

    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow || "";
    }

    return () => {
      document.body.style.overflow = originalOverflow || "";
    };
  }, [isMobileSidebarOpen]);

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
        <div className="admin-shell__inner">
          <Topbar onOpenSidebar={() => setIsMobileSidebarOpen(true)} />

          <main className="admin-shell__content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
