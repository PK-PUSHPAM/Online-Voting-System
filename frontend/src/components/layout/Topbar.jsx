import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Search, LogOut, ShieldCheck, UserCog, Bell } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const pageMetaMap = {
  "/admin": {
    eyebrow: "Analytics overview",
    title: "Admin Dashboard",
    description:
      "Track elections, voter approvals, vote activity, and recent system operations.",
  },
  "/admin/elections": {
    eyebrow: "Election lifecycle",
    title: "Elections Management",
    description:
      "Create, publish, monitor, and control election windows from one place.",
  },
  "/admin/posts": {
    eyebrow: "Structure",
    title: "Posts Management",
    description:
      "Manage available positions under each election in a controlled workflow.",
  },
  "/admin/candidates": {
    eyebrow: "Nomination pipeline",
    title: "Candidates Management",
    description:
      "Review candidate entries, approval state, and election-wise candidate mapping.",
  },
  "/admin/voters": {
    eyebrow: "Verification desk",
    title: "Voter Approvals",
    description:
      "Approve, reject, and review verification state for registered voters.",
  },
  "/admin/results": {
    eyebrow: "Outcome intelligence",
    title: "Results Analytics",
    description:
      "Inspect election-level and post-level outcomes, winners, ties, and candidate vote share.",
  },
  "/admin/manage-admins": {
    eyebrow: "Governance",
    title: "Manage Admins",
    description:
      "Control admin accounts, role transitions, and active system operators.",
  },
  "/admin/system": {
    eyebrow: "Governance trail",
    title: "System Control",
    description:
      "Track audit logs, admin actions, activity volume, and accountability signals.",
  },
};

export default function Topbar({ onOpenSidebar = () => {} }) {
  const location = useLocation();
  const { user, logout, isAuthActionLoading } = useAuth();

  const meta = useMemo(() => {
    return (
      pageMetaMap[location.pathname] || {
        eyebrow: "Admin panel",
        title: "Control Panel",
        description: "Manage the online voting system from a centralized UI.",
      }
    );
  }, [location.pathname]);

  const role = String(user?.role || "").toLowerCase();
  const isSuperAdmin = role === "super_admin" || role === "superadmin";

  const initials = useMemo(() => {
    const name = String(user?.fullName || "User").trim();
    const parts = name.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [user?.fullName]);

  return (
    <header className="admin-topbar">
      <div className="admin-topbar__left">
        <button
          type="button"
          className="admin-topbar__menu-btn"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="admin-topbar__title-wrap">
          <span className="admin-topbar__eyebrow">{meta.eyebrow}</span>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
      </div>

      <div className="admin-topbar__right">
        <div className="admin-topbar__search">
          <Search size={16} />
          <input type="text" placeholder="Search UI module later..." disabled />
        </div>

        <button
          type="button"
          className="admin-topbar__ghost-btn"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="admin-topbar__profile">
          <div className="admin-topbar__avatar">{initials}</div>

          <div className="admin-topbar__profile-text">
            <strong>{user?.fullName || "Admin User"}</strong>
            <span>
              {isSuperAdmin ? (
                <>
                  <ShieldCheck size={14} />
                  Super Admin
                </>
              ) : (
                <>
                  <UserCog size={14} />
                  Admin
                </>
              )}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="admin-topbar__logout-btn"
          onClick={logout}
          disabled={isAuthActionLoading}
        >
          <LogOut size={16} />
          {isAuthActionLoading ? "Signing out..." : "Logout"}
        </button>
      </div>
    </header>
  );
}
