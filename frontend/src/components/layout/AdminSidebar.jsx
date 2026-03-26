import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Vote,
  BarChart3,
  Briefcase,
  UserSquare2,
  Shield,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const linkStyle = ({ isActive }) => ({
  padding: "10px 12px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: isActive ? "#ffffff" : "#cccccc",
  background: isActive ? "rgba(91, 93, 240, 0.18)" : "transparent",
});

export default function AdminSidebar() {
  const { user } = useAuth();

  const role = String(user?.role || "").toLowerCase();
  const isSuperAdmin = role === "super_admin" || role === "superadmin";

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <img src="/icon/favicon.svg" alt="logo" />
        <span>VoteX</span>
      </div>

      <nav className="sidebar__nav">
        <NavLink to="/admin" style={linkStyle}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/admin/elections" style={linkStyle}>
          <Vote size={18} />
          Elections
        </NavLink>

        <NavLink to="/admin/posts" style={linkStyle}>
          <Briefcase size={18} />
          Posts
        </NavLink>

        <NavLink to="/admin/candidates" style={linkStyle}>
          <UserSquare2 size={18} />
          Candidates
        </NavLink>

        <NavLink to="/admin/voters" style={linkStyle}>
          <Users size={18} />
          Voters
        </NavLink>

        {/* 🔥 SUPER ADMIN ONLY */}
        {isSuperAdmin && (
          <>
            <NavLink to="/admin/manage-admins" style={linkStyle}>
              <Shield size={18} />
              Manage Admins
            </NavLink>

            <NavLink to="/admin/system" style={linkStyle}>
              <BarChart3 size={18} />
              System Control
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
