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
      >
        <div className="admin-sidebar__top">
          <div className="admin-sidebar__brand">
            <div className="admin-sidebar__brand-mark">
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
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="admin-sidebar__account-card">
          <div className="admin-sidebar__account-avatar">
            {initials || "AD"}
          </div>

          <div className="admin-sidebar__account-copy">
            <strong>{user?.fullName || "Admin User"}</strong>
            <span>{isSuperAdmin ? "Super Admin" : "Admin"}</span>
          </div>
        </div>

        <div className="admin-sidebar__status-stack">
          <div className="admin-sidebar__role-card">
            <div className="admin-sidebar__role-icon">
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
            <span className="admin-sidebar__mini-badge">
              {isActive ? <CheckCircle2 size={14} /> : <Activity size={14} />}
              {isActive ? "Active account" : "Restricted account"}
            </span>

            <span className="admin-sidebar__mini-badge">
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

        <div className="admin-sidebar__footer">
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
