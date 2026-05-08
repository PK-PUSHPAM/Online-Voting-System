import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings2,
  Shield,
  Sparkles,
  Trophy,
  UserCog,
  Users,
  UserSquare2,
  Vote,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../lib/routes";

const navGroups = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        to: APP_ROUTES.ADMIN_DASHBOARD,
        icon: LayoutDashboard,
        label: "Dashboard",
        end: true,
      },
    ],
  },
  {
    id: "election",
    label: "Election Setup",
    items: [
      {
        to: APP_ROUTES.ADMIN_ELECTIONS,
        icon: Vote,
        label: "Elections",
      },
      {
        to: APP_ROUTES.ADMIN_POSTS,
        icon: Briefcase,
        label: "Posts",
      },
      {
        to: APP_ROUTES.ADMIN_CANDIDATES,
        icon: UserSquare2,
        label: "Candidates",
      },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      {
        to: APP_ROUTES.ADMIN_VOTERS,
        icon: Users,
        label: "Voters",
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      {
        to: APP_ROUTES.ADMIN_RESULTS,
        icon: Trophy,
        label: "Results",
      },
    ],
  },
];

const superAdminGroup = {
  id: "superAdmin",
  label: "Super Admin",
  items: [
    {
      to: APP_ROUTES.ADMIN_MANAGE_ADMINS,
      icon: Shield,
      label: "Admins",
    },
    {
      to: APP_ROUTES.ADMIN_SYSTEM,
      icon: Settings2,
      label: "System",
    },
  ],
};

function getInitials(name = "Admin") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

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

      {!isCollapsed ? (
        <span className="admin-sidebar__link-label">{label}</span>
      ) : null}
    </NavLink>
  );
}

function SidebarGroup({ group, defaultOpen = false, isCollapsed, onNavigate }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (isCollapsed) {
    return (
      <div className="admin-sidebar__collapsed-group">
        {group.items.map((item) => (
          <SidebarLink
            key={item.to}
            {...item}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="admin-sidebar__nested-group">
      <button
        type="button"
        className="admin-sidebar__nested-trigger"
        onClick={() => setIsOpen((value) => !value)}
      >
        <span>{group.label}</span>
        <ChevronDown
          size={16}
          className={isOpen ? "admin-sidebar__chevron is-open" : ""}
        />
      </button>

      {isOpen ? (
        <div className="admin-sidebar__nested-links">
          {group.items.map((item) => (
            <SidebarLink
              key={item.to}
              {...item}
              isCollapsed={isCollapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
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
  const initials = getInitials(user?.fullName || "Admin");

  const groups = isSuperAdmin ? [...navGroups, superAdminGroup] : navGroups;

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
          "admin-sidebar--light",
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

            {!isDesktopCollapsed ? (
              <div className="admin-sidebar__brand-text">
                <strong>VoteX</strong>
                <span>Admin Console</span>
              </div>
            ) : null}
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

        {!isDesktopCollapsed ? (
          <div className="admin-sidebar__account-card">
            <div className="admin-sidebar__account-avatar">{initials}</div>

            <div className="admin-sidebar__account-copy">
              <strong>{user?.fullName || "Admin User"}</strong>
              <span>{isSuperAdmin ? "Super Admin" : "Admin"}</span>
            </div>
          </div>
        ) : null}

        {!isDesktopCollapsed ? (
          <div className="admin-sidebar__quick-card">
            <div className="admin-sidebar__quick-icon">
              {isSuperAdmin ? <Sparkles size={16} /> : <UserCog size={16} />}
            </div>

            <div>
              <strong>{isSuperAdmin ? "Full access" : "Admin access"}</strong>
              <span>{isActive ? "Account active" : "Account restricted"}</span>
            </div>
          </div>
        ) : null}

        <nav className="admin-sidebar__nav admin-sidebar__nav--nested">
          {groups.map((group, index) => (
            <SidebarGroup
              key={group.id}
              group={group}
              defaultOpen={index < 2}
              isCollapsed={isDesktopCollapsed}
              onNavigate={handleNavigate}
            />
          ))}
        </nav>

        {!isDesktopCollapsed ? (
          <div className="admin-sidebar__footer">
            <BarChart3 size={16} />
            <span>Clean control mode</span>
          </div>
        ) : null}
      </aside>

      {isMobileOpen ? (
        <button
          type="button"
          className="admin-sidebar__backdrop"
          onClick={onClose}
          aria-label="Close sidebar backdrop"
        />
      ) : null}
    </>
  );
}
