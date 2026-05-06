import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Menu,
  LogOut,
  ShieldCheck,
  UserCog,
  Bell,
  BadgeCheck,
  Activity,
} from "lucide-react";
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
  const isActive = user?.isActive !== false;

  const initials = useMemo(() => {
    const name = String(user?.fullName || "User").trim();
    const parts = name.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [user?.fullName]);

  return (
    <header
      className="admin-topbar"
      style={{
        background:
          "linear-gradient(135deg, rgba(24, 24, 44, 0.88), rgba(17, 24, 39, 0.82))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 60px rgba(15, 23, 42, 0.24)",
      }}
    >
      <div className="admin-topbar__left">
        <button
          type="button"
          className="admin-topbar__menu-btn"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
          style={{
            background:
              "linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(6, 182, 212, 0.14))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Menu size={20} />
        </button>

        <div className="admin-topbar__title-wrap">
          <span className="admin-topbar__eyebrow" style={{ color: "#f472b6" }}>
            {meta.eyebrow}
          </span>

          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
      </div>

      <div className="admin-topbar__right">
        <button
          type="button"
          className="admin-topbar__ghost-btn"
          aria-label="Notifications"
          title="Notifications"
          style={{
            background:
              "linear-gradient(135deg, rgba(6, 182, 212, 0.16), rgba(139, 92, 246, 0.12))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Bell size={18} />
        </button>

        <div
          className="admin-topbar__profile"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="admin-topbar__avatar"
            style={{
              background:
                "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 55%, #f472b6 100%)",
              boxShadow: "0 14px 28px rgba(139, 92, 246, 0.24)",
            }}
          >
            {initials}
          </div>

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

        <div
          className="admin-topbar__profile"
          style={{
            background: isActive
              ? "linear-gradient(135deg, rgba(52, 211, 153, 0.12), rgba(6, 182, 212, 0.08))"
              : "linear-gradient(135deg, rgba(251, 113, 133, 0.12), rgba(244, 114, 182, 0.08))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="admin-topbar__avatar"
            style={{
              background: isActive
                ? "linear-gradient(135deg, #34d399, #06b6d4)"
                : "linear-gradient(135deg, #fb7185, #f472b6)",
              boxShadow: isActive
                ? "0 14px 28px rgba(52, 211, 153, 0.22)"
                : "0 14px 28px rgba(244, 114, 182, 0.22)",
            }}
          >
            {isActive ? <BadgeCheck size={16} /> : <Activity size={16} />}
          </div>

          <div className="admin-topbar__profile-text">
            <strong>{isActive ? "Account Active" : "Account Limited"}</strong>
            <span>{user?.email || "No email available"}</span>
          </div>
        </div>

        <button
          type="button"
          className="admin-topbar__logout-btn"
          onClick={logout}
          disabled={isAuthActionLoading}
          style={{
            background:
              "linear-gradient(135deg, #8b5cf6 0%, #f472b6 52%, #f59e0b 100%)",
            boxShadow: "0 18px 34px rgba(244, 114, 182, 0.24)",
          }}
        >
          <LogOut size={16} />
          {isAuthActionLoading ? "Signing out..." : "Logout"}
        </button>
      </div>
    </header>
  );
}
