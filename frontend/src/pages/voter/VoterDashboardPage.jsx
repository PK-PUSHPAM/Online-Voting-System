import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileBadge2,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  UserCircle2,
  Vote,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { voterService } from "../../services/voter.service";
import { voteService } from "../../services/vote.service";
import { APP_ROUTES, buildVoterElectionDetailsRoute } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/voter.css";

const VOTES_PAGE_LIMIT = 10;

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "Active Now" },
  { id: "readiness", label: "Readiness" },
];

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

function formatStatus(value = "pending") {
  return String(value)
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function getReadiness(user) {
  const verificationStatus = String(
    user?.verificationStatus || "pending",
  ).toLowerCase();

  if (!user?.mobileVerified) {
    return {
      canVote: false,
      tone: "warning",
      title: "Mobile verification pending",
      message: "Verify your mobile number before voting access is enabled.",
    };
  }

  if (!user?.ageVerified) {
    return {
      canVote: false,
      tone: "warning",
      title: "Age verification pending",
      message: "Your age verification is still waiting for approval.",
    };
  }

  if (!user?.isEligibleToVote) {
    return {
      canVote: false,
      tone: "danger",
      title: "Voting access restricted",
      message: "Your account is not currently eligible to cast votes.",
    };
  }

  if (verificationStatus !== "approved") {
    return {
      canVote: false,
      tone: verificationStatus === "rejected" ? "danger" : "warning",
      title:
        verificationStatus === "rejected"
          ? "Verification rejected"
          : "Admin approval pending",
      message:
        verificationStatus === "rejected"
          ? user?.verificationRejectionReason ||
            "Your voter verification was rejected by the administrator."
          : "Admin approval is still required before you can vote.",
    };
  }

  return {
    canVote: true,
    tone: "success",
    title: "Ready to vote",
    message:
      "Your account is verified. You can vote when an election becomes active.",
  };
}

function MetricCard({ icon: Icon, label, value, helper, color = "mint" }) {
  return (
    <article
      className={`voter-clean-card voter-metric-card voter-metric-card--${color}`}
    >
      <div className="voter-metric-card__icon">
        <Icon size={18} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {helper ? <p>{helper}</p> : null}
      </div>
    </article>
  );
}

function CheckRow({ label, passed }) {
  return (
    <div className="voter-check-row voter-check-row--light">
      <span>{label}</span>
      <strong className={passed ? "text-success" : "text-warning"}>
        {passed ? "Completed" : "Pending"}
      </strong>
    </div>
  );
}

function ElectionMiniCard({ election, mode = "active" }) {
  const isUpcoming = election?.status === "upcoming";

  return (
    <article className="voter-election-mini-card">
      <span className={isUpcoming ? "status-chip status-chip--amber" : ""}>
        {isUpcoming ? "Upcoming" : "Active"}
      </span>

      <h4>{election?.title || "Election"}</h4>

      <p>{election?.description || "No description added."}</p>

      <div>
        {isUpcoming ? <TimerReset size={15} /> : <Clock3 size={15} />}
        {isUpcoming
          ? `Starts: ${formatDate(election?.startDate)}`
          : `Ends: ${formatDate(election?.endDate)}`}
      </div>

      {isUpcoming ? (
        <small className="voter-dashboard-note">
          Preview posts and candidates now. Voting opens on start date.
        </small>
      ) : null}

      <Link to={buildVoterElectionDetailsRoute(election._id)}>
        {mode === "upcoming" ? "Preview election" : "Open ballot"}
      </Link>
    </article>
  );
}

export default function VoterDashboardPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [elections, setElections] = useState([]);
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [electionData, votesData] = await Promise.all([
          voterService.getPublishedElections(),
          voteService.getMyVotes({ page: 1, limit: VOTES_PAGE_LIMIT }),
        ]);

        setElections(
          Array.isArray(electionData?.elections) ? electionData.elections : [],
        );

        setVotes(Array.isArray(votesData?.items) ? votesData.items : []);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        setElections([]);
        setVotes([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const readiness = useMemo(() => getReadiness(user), [user]);

  const upcomingElections = useMemo(() => {
    return elections
      .filter((election) => election?.status === "upcoming")
      .sort(
        (a, b) =>
          new Date(a?.startDate || 0).getTime() -
          new Date(b?.startDate || 0).getTime(),
      );
  }, [elections]);

  const activeElections = useMemo(() => {
    return elections
      .filter((election) => election?.status === "active")
      .sort(
        (a, b) =>
          new Date(a?.endDate || 0).getTime() -
          new Date(b?.endDate || 0).getTime(),
      );
  }, [elections]);

  const recentVotes = useMemo(() => {
    return [...votes]
      .sort(
        (a, b) =>
          new Date(b?.createdAt || 0).getTime() -
          new Date(a?.createdAt || 0).getTime(),
      )
      .slice(0, 3);
  }, [votes]);

  const nearestUpcomingElection = upcomingElections[0] || null;
  const nearestActiveElection = activeElections[0] || null;

  const readinessChecks = useMemo(
    () => [
      { label: "Mobile verified", passed: Boolean(user?.mobileVerified) },
      { label: "Age verified", passed: Boolean(user?.ageVerified) },
      { label: "Eligible to vote", passed: Boolean(user?.isEligibleToVote) },
      {
        label: "Admin approved",
        passed:
          String(user?.verificationStatus || "pending").toLowerCase() ===
          "approved",
      },
    ],
    [
      user?.ageVerified,
      user?.isEligibleToVote,
      user?.mobileVerified,
      user?.verificationStatus,
    ],
  );

  return (
    <section className="voter-page voter-page--dashboard">
      <section className="voter-page-hero voter-page-hero--peach">
        <div>
          <span className="voter-eyebrow">Voter workspace</span>
          <h2>Hello, {user?.fullName?.split(" ")?.[0] || "Voter"}</h2>
          <p>
            Track upcoming elections, active ballots, your voting readiness, and
            latest vote records from one clean dashboard.
          </p>
        </div>

        <div
          className={`voter-readiness-pill voter-readiness-pill--${readiness.tone}`}
        >
          {readiness.canVote ? (
            <ShieldCheck size={18} />
          ) : (
            <ShieldAlert size={18} />
          )}

          <div>
            <strong>{readiness.title}</strong>
            <span>{readiness.message}</span>
          </div>
        </div>
      </section>

      <div
        className="voter-option-tabs"
        role="tablist"
        aria-label="Dashboard options"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "is-active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="voter-tab-panel">
          <div className="voter-metric-grid">
            <MetricCard
              icon={TimerReset}
              label="Upcoming elections"
              value={loading ? "..." : upcomingElections.length}
              helper={
                nearestUpcomingElection
                  ? `Next starts: ${formatDate(nearestUpcomingElection.startDate)}`
                  : "No upcoming election found."
              }
              color="amber"
            />

            <MetricCard
              icon={Vote}
              label="Active elections"
              value={loading ? "..." : activeElections.length}
              helper={
                nearestActiveElection
                  ? `Nearest deadline: ${formatDate(nearestActiveElection.endDate)}`
                  : "No active election right now."
              }
              color="mint"
            />

            <MetricCard
              icon={CheckCircle2}
              label="Votes on this page"
              value={loading ? "..." : votes.length}
              helper={`Latest ${VOTES_PAGE_LIMIT} vote records loaded.`}
              color="violet"
            />
          </div>

          <div className="voter-two-column">
            <section className="voter-clean-card">
              <div className="voter-card-header">
                <div>
                  <h3>Upcoming elections</h3>
                  <p>Know what is coming before voting starts.</p>
                </div>

                <Link to={APP_ROUTES.VOTER_ELECTIONS}>View all</Link>
              </div>

              {loading ? (
                <div className="voter-empty-box">
                  Loading upcoming elections...
                </div>
              ) : upcomingElections.length ? (
                <div className="voter-election-mini-grid">
                  {upcomingElections.slice(0, 2).map((election) => (
                    <ElectionMiniCard
                      key={election._id}
                      election={election}
                      mode="upcoming"
                    />
                  ))}
                </div>
              ) : (
                <div className="voter-empty-box">
                  No upcoming elections available.
                </div>
              )}
            </section>

            <section className="voter-clean-card voter-profile-summary-card">
              <div className="voter-profile-summary-card__avatar voter-profile-summary-card__avatar--photo">
                {user?.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    alt={user?.fullName || "Voter"}
                  />
                ) : (
                  <UserCircle2 size={30} />
                )}
              </div>

              <h3>{user?.fullName || "Voter"}</h3>
              <p>{user?.email || "No email available"}</p>

              <div className="voter-profile-summary-card__meta">
                <span>{user?.mobileNumber || "No mobile"}</span>
                <span>{formatStatus(user?.verificationStatus)}</span>
              </div>

              <Link
                className="voter-clean-button voter-clean-button--full"
                to={APP_ROUTES.VOTER_PROFILE}
              >
                Open profile
              </Link>
            </section>
          </div>

          <section className="voter-clean-card">
            <div className="voter-card-header">
              <div>
                <h3>Recent votes</h3>
                <p>Latest vote records from your account.</p>
              </div>

              <Link to={APP_ROUTES.VOTER_MY_VOTES}>View all</Link>
            </div>

            {loading ? (
              <div className="voter-empty-box">Loading vote activity...</div>
            ) : recentVotes.length ? (
              <div className="voter-compact-list">
                {recentVotes.map((vote) => (
                  <article key={vote._id} className="voter-compact-item">
                    <div className="voter-compact-item__icon">
                      <CheckCircle2 size={16} />
                    </div>

                    <div>
                      <h4>{vote?.candidateId?.fullName || "Candidate"}</h4>
                      <p>
                        {vote?.postId?.title || "Post"} •{" "}
                        {vote?.electionId?.title || "Election"}
                      </p>
                    </div>

                    <span>{formatDate(vote?.createdAt)}</span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="voter-empty-box">
                No vote has been recorded yet.
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "upcoming" && (
        <div className="voter-tab-panel">
          <section className="voter-clean-card">
            <div className="voter-card-header">
              <div>
                <h3>Upcoming elections</h3>
                <p>
                  These elections are published but not started yet. You can
                  preview posts and candidates.
                </p>
              </div>

              <Link to={APP_ROUTES.VOTER_ELECTIONS}>Open election page</Link>
            </div>

            {loading ? (
              <div className="voter-empty-box">
                Loading upcoming elections...
              </div>
            ) : upcomingElections.length ? (
              <div className="voter-election-mini-grid">
                {upcomingElections.slice(0, 4).map((election) => (
                  <ElectionMiniCard
                    key={election._id}
                    election={election}
                    mode="upcoming"
                  />
                ))}
              </div>
            ) : (
              <div className="voter-empty-box">
                No upcoming elections available.
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "active" && (
        <div className="voter-tab-panel">
          <section className="voter-clean-card">
            <div className="voter-card-header">
              <div>
                <h3>Active elections</h3>
                <p>These elections are currently open for voting.</p>
              </div>

              <Link to={APP_ROUTES.VOTER_ELECTIONS}>Open election page</Link>
            </div>

            {loading ? (
              <div className="voter-empty-box">Loading active elections...</div>
            ) : activeElections.length ? (
              <div className="voter-election-mini-grid">
                {activeElections.slice(0, 4).map((election) => (
                  <ElectionMiniCard
                    key={election._id}
                    election={election}
                    mode="active"
                  />
                ))}
              </div>
            ) : (
              <div className="voter-empty-box">
                No active election right now.
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "readiness" && (
        <div className="voter-tab-panel">
          <div className="voter-two-column">
            <section className="voter-clean-card">
              <div className="voter-card-header">
                <div>
                  <h3>Readiness checklist</h3>
                  <p>
                    These checks decide whether backend will allow voting during
                    active elections.
                  </p>
                </div>
              </div>

              <div className="voter-check-list">
                {readinessChecks.map((check) => (
                  <CheckRow
                    key={check.label}
                    label={check.label}
                    passed={check.passed}
                  />
                ))}
              </div>
            </section>

            <section className="voter-clean-card voter-info-note-card">
              <FileBadge2 size={24} />
              <h3>Account status</h3>
              <p>{readiness.message}</p>

              <div className="voter-status-grid-light">
                <span>Role</span>
                <strong>{formatStatus(user?.role || "voter")}</strong>

                <span>Voter ID</span>
                <strong>{user?.internalVoterId || "Not assigned"}</strong>

                <span>Approval</span>
                <strong>{formatStatus(user?.verificationStatus)}</strong>
              </div>
            </section>
          </div>
        </div>
      )}
    </section>
  );
}
