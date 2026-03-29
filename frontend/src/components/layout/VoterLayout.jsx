import { useState } from "react";
import { Outlet } from "react-router-dom";
import VoterSidebar from "./VoterSidebar";
import VoterTopbar from "./VoterTopbar";

export default function VoterLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);

  return (
    <div className="admin-shell">
      <VoterSidebar
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
        <VoterTopbar onOpenSidebar={() => setIsMobileSidebarOpen(true)} />

        <main className="admin-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
