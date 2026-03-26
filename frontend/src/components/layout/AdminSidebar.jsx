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
  X,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

function SidebarLink({ to, icon: Icon, label, end = false, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
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

          <button
            type="button"
            className="admin-sidebar__icon-btn admin-sidebar__desktop-toggle"
            onClick={onDesktopToggle}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft size={18} />
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

        <nav className="admin-sidebar__nav">
          <SidebarLink
            to="/admin"
            end
            icon={LayoutDashboard}
            label="Dashboard"
            onNavigate={handleNavigate}
          />

          <SidebarLink
            to="/admin/elections"
            icon={Vote}
            label="Elections"
            onNavigate={handleNavigate}
          />

          <SidebarLink
            to="/admin/posts"
            icon={Briefcase}
            label="Posts"
            onNavigate={handleNavigate}
          />

          <SidebarLink
            to="/admin/candidates"
            icon={UserSquare2}
            label="Candidates"
            onNavigate={handleNavigate}
          />

          <SidebarLink
            to="/admin/voters"
            icon={Users}
            label="Voters"
            onNavigate={handleNavigate}
          />

          <SidebarLink
            to="/admin/results"
            icon={Trophy}
            label="Results Analytics"
            onNavigate={handleNavigate}
          />

          {isSuperAdmin && (
            <>
              <div className="admin-sidebar__group-label">Super Admin</div>

              <SidebarLink
                to="/admin/manage-admins"
                icon={Shield}
                label="Manage Admins"
                onNavigate={handleNavigate}
              />

              <SidebarLink
                to="/admin/system"
                icon={BarChart3}
                label="System Control"
                onNavigate={handleNavigate}
              />
            </>
          )}
        </nav>

        <div className="admin-sidebar__footer">
          <p>
            Product UI ka matlab hai control, clarity, and trust. Sirf flashy
            gradients se kaam nahi chalta.
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
