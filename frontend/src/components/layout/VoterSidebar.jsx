import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Vote,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  X,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../lib/routes";

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

export default function VoterSidebar({
  isMobileOpen = false,
  onClose = () => {},
  isDesktopCollapsed = false,
  onDesktopToggle = () => {},
}) {
  const { user } = useAuth();

  const handleNavigate = () => {
    if (isMobileOpen) {
      onClose();
    }
  };

  const verificationStatus = String(user?.verificationStatus || "pending");
  const verificationTitle =
    verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1);

  return (
    <>
      <aside
        className={[
          "admin-sidebar",
          "voter-sidebar",
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
              <span>Secure voter panel</span>
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

        <div className="admin-sidebar__role-card voter-sidebar__role-card">
          <div className="admin-sidebar__role-icon">
            <Sparkles size={16} />
          </div>

          <div>
            <p className="admin-sidebar__role-label">Signed in as</p>
            <h4 className="admin-sidebar__role-title">Verified Voter Panel</h4>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          <SidebarLink
            to={APP_ROUTES.VOTER_DASHBOARD}
            end
            icon={LayoutDashboard}
            label="Dashboard"
            onNavigate={handleNavigate}
          />

          <SidebarLink
            to={APP_ROUTES.VOTER_ELECTIONS}
            icon={Vote}
            label="Active Elections"
            onNavigate={handleNavigate}
          />

          <SidebarLink
            to={APP_ROUTES.VOTER_MY_VOTES}
            icon={CheckCircle2}
            label="My Votes"
            onNavigate={handleNavigate}
          />

          <SidebarLink
            to={APP_ROUTES.VOTER_PROFILE}
            icon={UserCircle2}
            label="Profile & Status"
            onNavigate={handleNavigate}
          />
        </nav>

        <div className="admin-sidebar__footer">
          <div className="voter-sidebar__status-row">
            <ShieldCheck size={16} />
            <strong>Status: {verificationTitle}</strong>
          </div>

          <p>
            Voter UI ka kaam simple hona chahiye: clear election list, clear
            eligibility status, aur clear vote action. Confusion means bad
            product.
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
