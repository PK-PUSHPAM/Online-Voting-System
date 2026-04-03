import { useMemo } from "react";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  FileBadge2,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/voter.css";

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function formatDateOnly(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <article className="voter-info-card">
      <div className="voter-info-card__icon">
        <Icon size={18} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value || "-"}</strong>
      </div>
    </article>
  );
}

export default function VoterProfilePage() {
  const { user } = useAuth();

  const verificationStatus = String(user?.verificationStatus || "pending");
  const verificationLabel =
    verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1);

  const readinessText = useMemo(() => {
    if (!user?.mobileVerified) {
      return "Your mobile number is not yet verified.";
    }

    if (!user?.ageVerified) {
      return "Your age verification is still pending.";
    }

    if (!user?.isEligibleToVote) {
      return "Your account has not yet cleared eligibility validation.";
    }

    if (verificationStatus !== "approved") {
      return "Administrative approval is still required before voting can begin.";
    }

    return "Your account is verified and ready for voting.";
  }, [
    user?.mobileVerified,
    user?.ageVerified,
    user?.isEligibleToVote,
    verificationStatus,
  ]);

  const roleLabel = String(user?.role || "voter").replaceAll("_", " ");

  return (
    <section className="voter-page">
      <div className="voter-section-heading">
        <div>
          <h2>Profile & Voting Status</h2>
          <p>
            Review your account details, verification checks, and readiness for
            participating in elections.
          </p>
        </div>
      </div>

      <section className="voter-profile-hero">
        <div className="voter-profile-hero__identity">
          <div className="voter-profile-hero__avatar">
            <UserCircle2 size={26} />
          </div>

          <div>
            <h3>{user?.fullName || "Voter"}</h3>
            <p>{user?.email || "-"}</p>
            <span className="voter-tag voter-tag--soft">Role: {roleLabel}</span>
          </div>
        </div>

        <div className="voter-profile-hero__status-grid">
          <div
            className={`voter-status-tile ${
              user?.mobileVerified
                ? "voter-status-tile--success"
                : "voter-status-tile--warning"
            }`}
          >
            <CheckCircle2 size={18} />
            <div>
              <span>Mobile</span>
              <strong>{user?.mobileVerified ? "Verified" : "Pending"}</strong>
            </div>
          </div>

          <div
            className={`voter-status-tile ${
              user?.ageVerified
                ? "voter-status-tile--success"
                : "voter-status-tile--warning"
            }`}
          >
            <BadgeCheck size={18} />
            <div>
              <span>Age Check</span>
              <strong>{user?.ageVerified ? "Verified" : "Pending"}</strong>
            </div>
          </div>

          <div
            className={`voter-status-tile ${
              user?.isEligibleToVote
                ? "voter-status-tile--success"
                : "voter-status-tile--danger"
            }`}
          >
            <ShieldCheck size={18} />
            <div>
              <span>Eligibility</span>
              <strong>
                {user?.isEligibleToVote ? "Cleared" : "Restricted"}
              </strong>
            </div>
          </div>

          <div
            className={`voter-status-tile ${
              verificationStatus === "approved"
                ? "voter-status-tile--success"
                : verificationStatus === "rejected"
                  ? "voter-status-tile--danger"
                  : "voter-status-tile--warning"
            }`}
          >
            {verificationStatus === "rejected" ? (
              <XCircle size={18} />
            ) : (
              <ShieldAlert size={18} />
            )}

            <div>
              <span>Approval State</span>
              <strong>{verificationLabel}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="voter-alert voter-alert--info">
        <ShieldCheck size={18} />
        <div>
          <strong>Account readiness</strong>
          <p>{readinessText}</p>
        </div>
      </section>

      {verificationStatus === "rejected" && (
        <section className="voter-alert voter-alert--danger">
          <ShieldAlert size={18} />
          <div>
            <strong>Verification rejected</strong>
            <p>
              {user?.verificationRejectionReason ||
                "No rejection reason has been provided by the administrator."}
            </p>
          </div>
        </section>
      )}

      <div className="voter-profile-layout">
        <section className="voter-panel">
          <div className="voter-panel__header">
            <div>
              <h3>Identity Details</h3>
              <p>
                Core account details currently stored for your voter profile.
              </p>
            </div>
          </div>

          <div className="voter-info-grid">
            <InfoCard
              icon={UserCircle2}
              label="Full Name"
              value={user?.fullName}
            />
            <InfoCard icon={Mail} label="Email" value={user?.email} />
            <InfoCard
              icon={Phone}
              label="Mobile Number"
              value={user?.mobileNumber}
            />
            <InfoCard
              icon={FileBadge2}
              label="Internal Voter ID"
              value={user?.internalVoterId || "Not assigned yet"}
            />
            <InfoCard
              icon={FileBadge2}
              label="Identity Type"
              value={user?.identityType || "-"}
            />
            <InfoCard
              icon={FileBadge2}
              label="Identity Last 4"
              value={user?.identityLast4 || "-"}
            />
            <InfoCard
              icon={CalendarDays}
              label="Date of Birth"
              value={formatDateOnly(user?.dob)}
            />
            <InfoCard
              icon={CalendarDays}
              label="Account Created"
              value={formatDate(user?.createdAt)}
            />
          </div>
        </section>

        <section className="voter-panel">
          <div className="voter-panel__header">
            <div>
              <h3>Verification Summary</h3>
              <p>
                These checks directly affect whether voting is enabled for your
                account.
              </p>
            </div>
          </div>

          <div className="voter-check-list">
            <div className="voter-check-row">
              <span>Verification Status</span>
              <strong>{verificationLabel}</strong>
            </div>

            <div className="voter-check-row">
              <span>Mobile Verified</span>
              <strong>{user?.mobileVerified ? "Yes" : "No"}</strong>
            </div>

            <div className="voter-check-row">
              <span>Age Verified</span>
              <strong>{user?.ageVerified ? "Yes" : "No"}</strong>
            </div>

            <div className="voter-check-row">
              <span>Eligible To Vote</span>
              <strong>{user?.isEligibleToVote ? "Yes" : "No"}</strong>
            </div>

            <div className="voter-check-row">
              <span>Rejection Reason</span>
              <strong>{user?.verificationRejectionReason || "-"}</strong>
            </div>
          </div>

          <div className="voter-note-card">
            <strong>Important note</strong>
            <p>
              Final voting access is determined by backend verification and
              approval logic. Profile visibility alone does not grant voting
              permission.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}
