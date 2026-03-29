import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Menu,
  LogOut,
  ShieldCheck,
  Clock3,
  BadgeCheck,
  UserCircle2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const pageMetaMap = {
  "/voter": {
    eyebrow: "Overview",
    title: "Voter Dashboard",
    description:
      "See your eligibility, active elections, vote activity, and approval state in one place.",
  },
  "/voter/elections": {
    eyebrow: "Live ballots",
    title: "Active Elections",
    description:
      "Open active elections, inspect posts, review candidates, and cast votes carefully.",
  },
  "/voter/my-votes": {
    eyebrow: "Personal audit",
    title: "My Votes",
    description:
      "Review the votes you have already cast across elections and posts.",
  },
  "/voter/profile": {
    eyebrow: "Verification",
    title: "Profile & Voting Status",
    description:
      "Track approval state, eligibility checks, and account readiness before voting.",
  },
};

export default function VoterTopbar({ onOpenSidebar = () => {} }) {
  const location = useLocation();
  const { user, logout, isAuthActionLoading } = useAuth();

  const meta = useMemo(() => {
    if (location.pathname.startsWith("/voter/elections/")) {
      return {
        eyebrow: "Ballot room",
        title: "Election Voting",
        description:
          "Choose candidates carefully. Duplicate and invalid votes are blocked by the backend.",
      };
    }

    return (
      pageMetaMap[location.pathname] || {
        eyebrow: "Voter panel",
        title: "Voting Workspace",
        description:
          "Access elections, status, and your recorded vote history.",
      }
    );
  }, [location.pathname]);

  const initials = useMemo(() => {
    const name = String(user?.fullName || "Voter").trim();
    const parts = name.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [user?.fullName]);

  const verificationStatus = String(user?.verificationStatus || "pending");
  const verificationLabel =
    verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1);

  return (
    <header className="admin-topbar voter-topbar">
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
        <div className="voter-topbar__status-pills">
          <span className="voter-topbar__pill">
            <ShieldCheck size={14} />
            {verificationLabel}
          </span>

          <span className="voter-topbar__pill">
            <BadgeCheck size={14} />
            {user?.isEligibleToVote ? "Eligible" : "Not Eligible"}
          </span>

          <span className="voter-topbar__pill">
            <Clock3 size={14} />
            {user?.mobileVerified ? "Mobile Verified" : "Mobile Pending"}
          </span>
        </div>

        <div className="admin-topbar__profile">
          <div className="admin-topbar__avatar">{initials}</div>

          <div className="admin-topbar__profile-text">
            <strong>{user?.fullName || "Voter"}</strong>
            <span>
              <UserCircle2 size={14} />
              Voter
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
