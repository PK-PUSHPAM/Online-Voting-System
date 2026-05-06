import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  FileCheck2,
  LayoutDashboard,
  ListChecks,
  LogOut,
  ShieldCheck,
  Vote,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../lib/routes";

function getStatusLabel(value = "pending") {
  return String(value)
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
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
        `voter-side-link ${isActive ? "voter-side-link--active" : ""}`
      }
      onClick={onNavigate}
    >
      <span className="voter-side-link__icon">
        <Icon size={18} />
      </span>

      {!isCollapsed && <span className="voter-side-link__label">{label}</span>}
    </NavLink>
  );
}

export default function VoterSidebar({
  isMobileOpen = false,
  onClose = () => {},
  isDesktopCollapsed = false,
  onDesktopToggle = () => {},
}) {
  const { user, logout, isAuthActionLoading } = useAuth();
  const [isVotingGroupOpen, setIsVotingGroupOpen] = useState(true);

  const initials = useMemo(() => {
    const name = String(user?.fullName || "Voter").trim();
    const parts = name.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
  }, [user?.fullName]);

  const verificationStatus = getStatusLabel(user?.verificationStatus);
  const isApproved =
    String(user?.verificationStatus || "").toLowerCase() === "approved";

  const handleNavigate = () => {
    if (isMobileOpen) {
      onClose();
    }
  };

  return (
    <>
      <aside
        className={[
          "voter-sidebar-clean",
          isMobileOpen ? "voter-sidebar-clean--mobile-open" : "",
          isDesktopCollapsed ? "voter-sidebar-clean--collapsed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="voter-sidebar-clean__top">
          <div className="voter-sidebar-clean__brand">
            <div className="voter-sidebar-clean__brand-icon">
              <Vote size={20} />
            </div>

            {!isDesktopCollapsed && (
              <div>
                <strong>VoteX</strong>
                <span>Voter panel</span>
              </div>
            )}
          </div>

          <div className="voter-sidebar-clean__actions">
            <button
              type="button"
              className="voter-sidebar-clean__icon-btn voter-sidebar-clean__desktop-toggle"
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
              className="voter-sidebar-clean__icon-btn voter-sidebar-clean__mobile-close"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {!isDesktopCollapsed && (
          <div className="voter-sidebar-clean__profile">
            <div className="voter-sidebar-clean__avatar voter-sidebar-clean__avatar--photo">
              {user?.profilePhotoUrl ? (
                <img
                  src={user.profilePhotoUrl}
                  alt={user?.fullName || "Voter"}
                />
              ) : (
                <span>{initials || "VT"}</span>
              )}
            </div>

            <div>
              <strong>{user?.fullName || "Voter"}</strong>
              <span>{user?.email || "No email"}</span>
            </div>
          </div>
        )}

        {!isDesktopCollapsed && (
          <div
            className={`voter-sidebar-clean__status ${
              isApproved
                ? "voter-sidebar-clean__status--success"
                : "voter-sidebar-clean__status--warning"
            }`}
          >
            <ShieldCheck size={16} />
            <div>
              <strong>{verificationStatus}</strong>
              <span>
                {isApproved
                  ? "Voting access enabled"
                  : "Approval still required"}
              </span>
            </div>
          </div>
        )}

        <nav className="voter-sidebar-clean__nav">
          <SidebarLink
            to={APP_ROUTES.VOTER_DASHBOARD}
            end
            icon={LayoutDashboard}
            label="Dashboard"
            onNavigate={handleNavigate}
            isCollapsed={isDesktopCollapsed}
          />

          <div className="voter-sidebar-clean__group">
            <button
              type="button"
              className="voter-sidebar-clean__group-btn"
              onClick={() => setIsVotingGroupOpen((prev) => !prev)}
              title={isDesktopCollapsed ? "Voting" : undefined}
            >
              <span className="voter-side-link__icon">
                <Vote size={18} />
              </span>

              {!isDesktopCollapsed && (
                <>
                  <span>Voting</span>
                  <ChevronDown
                    size={16}
                    className={
                      isVotingGroupOpen
                        ? "voter-sidebar-clean__chevron voter-sidebar-clean__chevron--open"
                        : "voter-sidebar-clean__chevron"
                    }
                  />
                </>
              )}
            </button>

            {(isVotingGroupOpen || isDesktopCollapsed) && (
              <div className="voter-sidebar-clean__subnav">
                <SidebarLink
                  to={APP_ROUTES.VOTER_ELECTIONS}
                  icon={ListChecks}
                  label="Published Elections"
                  onNavigate={handleNavigate}
                  isCollapsed={isDesktopCollapsed}
                />

                <SidebarLink
                  to={APP_ROUTES.VOTER_MY_VOTES}
                  icon={FileCheck2}
                  label="My Votes"
                  onNavigate={handleNavigate}
                  isCollapsed={isDesktopCollapsed}
                />
              </div>
            )}
          </div>

          <SidebarLink
            to={APP_ROUTES.VOTER_PROFILE}
            icon={CircleUserRound}
            label="Profile"
            onNavigate={handleNavigate}
            isCollapsed={isDesktopCollapsed}
          />
        </nav>

        <div className="voter-sidebar-clean__bottom">
          {!isDesktopCollapsed && (
            <div className="voter-sidebar-clean__mini-info">
              <BadgeCheck size={16} />
              <span>
                {user?.isEligibleToVote
                  ? "Eligible voter"
                  : "Eligibility pending"}
              </span>
            </div>
          )}

          <button
            type="button"
            className="voter-sidebar-clean__logout"
            onClick={logout}
            disabled={isAuthActionLoading}
            title={isDesktopCollapsed ? "Logout" : undefined}
          >
            <LogOut size={17} />
            {!isDesktopCollapsed && (
              <span>{isAuthActionLoading ? "Signing out..." : "Logout"}</span>
            )}
          </button>
        </div>
      </aside>

      {isMobileOpen && (
        <button
          type="button"
          className="voter-sidebar-clean__backdrop"
          onClick={onClose}
          aria-label="Close sidebar backdrop"
        />
      )}
    </>
  );
}
