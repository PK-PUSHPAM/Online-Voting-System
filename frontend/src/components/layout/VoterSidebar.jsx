import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Vote,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  UserCircle2,
  Clock3,
  BadgeCheck,
  XCircle,
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
  const isEligible = Boolean(user?.isEligibleToVote);
  const isMobileVerified = Boolean(user?.mobileVerified);

  const initials = String(user?.fullName || "Voter")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

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
              <span>Secure voter workspace</span>
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
            {initials || "VT"}
          </div>

          <div className="admin-sidebar__account-copy">
            <strong>{user?.fullName || "Voter"}</strong>
            <span>Voter account</span>
          </div>
        </div>

        <div className="admin-sidebar__status-stack">
          <div className="admin-sidebar__role-card voter-sidebar__role-card">
            <div className="admin-sidebar__role-icon">
              <Sparkles size={16} />
            </div>

            <div>
              <p className="admin-sidebar__role-label">Panel access</p>
              <h4 className="admin-sidebar__role-title">
                Verified Voter Space
              </h4>
            </div>
          </div>

          <div className="admin-sidebar__mini-status">
            <span className="admin-sidebar__mini-badge">
              <ShieldCheck size={14} />
              {verificationTitle}
            </span>

            <span className="admin-sidebar__mini-badge">
              {isEligible ? <BadgeCheck size={14} /> : <XCircle size={14} />}
              {isEligible ? "Eligible to vote" : "Not eligible"}
            </span>

            <span className="admin-sidebar__mini-badge">
              <Clock3 size={14} />
              {isMobileVerified ? "Mobile verified" : "Mobile pending"}
            </span>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          <SidebarLink
            to={APP_ROUTES.VOTER_DASHBOARD}
            end
            icon={LayoutDashboard}
            label="Dashboard"
            onNavigate={handleNavigate}
            isCollapsed={isDesktopCollapsed}
          />

          <SidebarLink
            to={APP_ROUTES.VOTER_ELECTIONS}
            icon={Vote}
            label="Active Elections"
            onNavigate={handleNavigate}
            isCollapsed={isDesktopCollapsed}
          />

          <SidebarLink
            to={APP_ROUTES.VOTER_MY_VOTES}
            icon={CheckCircle2}
            label="My Votes"
            onNavigate={handleNavigate}
            isCollapsed={isDesktopCollapsed}
          />

          <SidebarLink
            to={APP_ROUTES.VOTER_PROFILE}
            icon={UserCircle2}
            label="Profile & Status"
            onNavigate={handleNavigate}
            isCollapsed={isDesktopCollapsed}
          />
        </nav>

        <div className="admin-sidebar__footer">
          <p>
            Voter screen simple honi chahiye. Election dikho, status dikho, vote
            karo. Extra noise sirf UX ko kharab karta hai.
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
