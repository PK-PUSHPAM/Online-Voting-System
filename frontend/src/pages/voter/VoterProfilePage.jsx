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
    if (!user?.mobileVerified) return "Mobile verification is still pending.";
    if (!user?.ageVerified) return "Age verification is not completed yet.";
    if (!user?.isEligibleToVote)
      return "Eligibility check failed or not cleared.";
    if (verificationStatus !== "approved") {
      return "Admin approval is still required before you can vote.";
    }

    return "Your account is in a clean state for voting.";
  }, [
    user?.mobileVerified,
    user?.ageVerified,
    user?.isEligibleToVote,
    verificationStatus,
  ]);

  return (
    <section className="voter-page">
      <div className="voter-section-heading">
        <div>
          <h2>Profile & Voting Status</h2>
          <p>
            Is page ka kaam sirf dikhawa nahi hai. Yahin se voter ko clear
            dikhna chahiye ki vote kar sakta hai ya nahi.
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
            <span className="voter-tag voter-tag--soft">
              Role: {String(user?.role || "voter").replace("_", " ")}
            </span>
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
              <strong>{user?.isEligibleToVote ? "Cleared" : "Blocked"}</strong>
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
            <strong>Why your profile is blocked</strong>
            <p>
              {user?.verificationRejectionReason ||
                "Rejection reason was not provided by the admin."}
            </p>
          </div>
        </section>
      )}

      <div className="voter-profile-layout">
        <section className="voter-panel">
          <div className="voter-panel__header">
            <div>
              <h3>Identity Details</h3>
              <p>Core personal and voter-linked fields from your account.</p>
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
              <p>These flags directly affect whether vote casting will work.</p>
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
              <span>Verified At</span>
              <strong>{formatDate(user?.verifiedAt)}</strong>
            </div>

            <div className="voter-check-row">
              <span>Document Uploaded</span>
              <strong>{user?.documentUrl ? "Yes" : "No"}</strong>
            </div>
          </div>

          {user?.verificationNotes ? (
            <div className="voter-note-card">
              <strong>Admin / verification notes</strong>
              <p>{user.verificationNotes}</p>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
