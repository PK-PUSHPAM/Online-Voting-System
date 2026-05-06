import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Vote,
  BarChart3,
  Briefcase,
  UserSquare2,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Trophy,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../lib/routes";

function SidebarLink({
  to,
  icon: Icon,
  label,
  end = false,
  onNavigate,
  isCollapsed = false,
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={isCollapsed ? label : undefined}
      className={({ isActive }) =>
        `admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""}`
      }
      onClick={onNavigate}
      style={({ isActive }) => ({
        background: isActive
          ? "linear-gradient(135deg, rgba(139, 92, 246, 0.28), rgba(6, 182, 212, 0.18), rgba(244, 114, 182, 0.18))"
          : "transparent",
        borderColor: isActive ? "rgba(244, 114, 182, 0.24)" : "transparent",
        boxShadow: isActive
          ? "0 12px 28px rgba(15, 23, 42, 0.24), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "none",
      })}
    >
      <span className="admin-sidebar__link-icon">
        <Icon size={18} />
      </span>
      <span className="admin-sidebar__link-label">{label}</span>
    </NavLink>
  );
}

export default function AdminSidebar({
  isMobileOpen = false,
  onClose = () => {},
  isDesktopCollapsed = false,
  onDesktopToggle = () => {},
}) {
  const { user } = useAuth();

  const role = String(user?.role || "").toLowerCase();
  const isSuperAdmin = role === "super_admin" || role === "superadmin";
  const isActive = user?.isActive !== false;

  const initials = String(user?.fullName || "Admin")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const handleNavigate = () => {
    if (isMobileOpen) {
      onClose();
    }
  };

  return (
    <>
      <aside
        className={[
          "admin-sidebar",
          isMobileOpen ? "admin-sidebar--mobile-open" : "",
          isDesktopCollapsed ? "admin-sidebar--collapsed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          background:
            "linear-gradient(180deg, rgba(24, 24, 44, 0.96), rgba(17, 24, 39, 0.94))",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow:
            "0 30px 80px rgba(15, 23, 42, 0.42), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="admin-sidebar__top">
          <div className="admin-sidebar__brand">
            <div
              className="admin-sidebar__brand-mark"
              style={{
                background:
                  "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 48%, #f472b6 100%)",
                boxShadow: "0 18px 36px rgba(139, 92, 246, 0.34)",
              }}
            >
              <Vote size={18} />
            </div>

            <div className="admin-sidebar__brand-text">
              <strong>VoteX Pro</strong>
              <span>Election control panel</span>
            </div>
          </div>

          <div className="admin-sidebar__top-actions">
            <button
              type="button"
              className="admin-sidebar__icon-btn admin-sidebar__desktop-toggle"
              onClick={onDesktopToggle}
              aria-label="Toggle sidebar"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139, 92, 246, 0.16), rgba(6, 182, 212, 0.14))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {isDesktopCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>

            <button
              type="button"
              className="admin-sidebar__icon-btn admin-sidebar__mobile-close"
              onClick={onClose}
              aria-label="Close sidebar"
              style={{
                background:
                  "linear-gradient(135deg, rgba(244, 114, 182, 0.16), rgba(251, 146, 60, 0.14))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div
          className="admin-sidebar__account-card"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.18)",
          }}
        >
          <div
            className="admin-sidebar__account-avatar"
            style={{
              background:
                "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 52%, #f59e0b 100%)",
              boxShadow: "0 16px 32px rgba(6, 182, 212, 0.24)",
            }}
          >
            {initials || "AD"}
          </div>

          <div className="admin-sidebar__account-copy">
            <strong>{user?.fullName || "Admin User"}</strong>
            <span>{isSuperAdmin ? "Super Admin" : "Admin"}</span>
          </div>
        </div>

        <div className="admin-sidebar__status-stack">
          <div
            className="admin-sidebar__role-card"
            style={{
              background:
                "linear-gradient(135deg, rgba(139, 92, 246, 0.22), rgba(6, 182, 212, 0.16), rgba(244, 114, 182, 0.12))",
              border: "1px solid rgba(167, 139, 250, 0.22)",
              boxShadow: "0 14px 30px rgba(15, 23, 42, 0.18)",
            }}
          >
            <div
              className="admin-sidebar__role-icon"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))",
              }}
            >
              <Sparkles size={16} />
            </div>

            <div>
              <p className="admin-sidebar__role-label">Signed in as</p>
              <h4 className="admin-sidebar__role-title">
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </h4>
            </div>
          </div>

          <div className="admin-sidebar__mini-status">
            <span
              className="admin-sidebar__mini-badge"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, rgba(52, 211, 153, 0.14), rgba(6, 182, 212, 0.08))"
                  : "linear-gradient(135deg, rgba(251, 113, 133, 0.14), rgba(244, 114, 182, 0.08))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {isActive ? <CheckCircle2 size={14} /> : <Activity size={14} />}
              {isActive ? "Active account" : "Restricted account"}
            </span>

            <span
              className="admin-sidebar__mini-badge"
              style={{
                background:
                  "linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(244, 114, 182, 0.08))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Shield size={14} />
              {user?.email || "No email"}
            </span>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          <SidebarLink
            to={APP_ROUTES.ADMIN_DASHBOARD}
            end
            icon={LayoutDashboard}
            label="Dashboard"
            onNavigate={handleNavigate}
            isCollapsed={isDesktopCollapsed}
          />

          <SidebarLink
            to={APP_ROUTES.ADMIN_ELECTIONS}
            icon={Vote}
            label="Elections"
            onNavigate={handleNavigate}
            isCollapsed={isDesktopCollapsed}
          />

          <SidebarLink
            to={APP_ROUTES.ADMIN_POSTS}
            icon={Briefcase}
            label="Posts"
            onNavigate={handleNavigate}
            isCollapsed={isDesktopCollapsed}
          />

          <SidebarLink
            to={APP_ROUTES.ADMIN_CANDIDATES}
            icon={UserSquare2}
            label="Candidates"
            onNavigate={handleNavigate}
            isCollapsed={isDesktopCollapsed}
          />

          <SidebarLink
            to={APP_ROUTES.ADMIN_VOTERS}
            icon={Users}
            label="Voters"
            onNavigate={handleNavigate}
            isCollapsed={isDesktopCollapsed}
          />

          <SidebarLink
            to={APP_ROUTES.ADMIN_RESULTS}
            icon={Trophy}
            label="Results Analytics"
            onNavigate={handleNavigate}
            isCollapsed={isDesktopCollapsed}
          />

          {isSuperAdmin && (
            <>
              <div className="admin-sidebar__group-label">Super Admin</div>

              <SidebarLink
                to={APP_ROUTES.ADMIN_MANAGE_ADMINS}
                icon={Shield}
                label="Manage Admins"
                onNavigate={handleNavigate}
                isCollapsed={isDesktopCollapsed}
              />

              <SidebarLink
                to={APP_ROUTES.ADMIN_SYSTEM}
                icon={BarChart3}
                label="System Control"
                onNavigate={handleNavigate}
                isCollapsed={isDesktopCollapsed}
              />
            </>
          )}
        </nav>

        <div
          className="admin-sidebar__footer"
          style={{
            background:
              "linear-gradient(135deg, rgba(244, 114, 182, 0.08), rgba(245, 158, 11, 0.08), rgba(6, 182, 212, 0.08))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p>
            Good admin UI ka matlab hai fewer clicks, less confusion, and zero
            guesswork. Fancy bakwaas se operations nahi chalte.
          </p>
        </div>
      </aside>

      {isMobileOpen && (
        <button
          type="button"
          className="admin-sidebar__backdrop"
          onClick={onClose}
          aria-label="Close sidebar backdrop"
        />
      )}
    </>
  );
}
