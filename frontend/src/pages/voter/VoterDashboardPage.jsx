import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  ArrowRight,
  AlertTriangle,
  BadgeCheck,
  UserCircle2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { voterService } from "../../services/voter.service";
import { voteService } from "../../services/vote.service";
import { APP_ROUTES } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <article className="voter-stat-card">
      <div className="voter-stat-card__icon">
        <Icon size={18} />
      </div>

      <div>
        <p className="voter-stat-card__label">{label}</p>
        <h3 className="voter-stat-card__value">{value}</h3>
        <span className="voter-stat-card__helper">{helper}</span>
      </div>
    </article>
  );
}

function getStatusTone(status) {
  switch (String(status || "").toLowerCase()) {
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "warning";
  }
}

export default function VoterDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeElectionsData, setActiveElectionsData] = useState({
    count: 0,
    elections: [],
  });
  const [myVotesData, setMyVotesData] = useState({
    items: [],
    pagination: null,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [electionsResponse, votesResponse] = await Promise.all([
          voterService.getActiveElections(),
          voteService.getMyVotes({ page: 1, limit: 5 }),
        ]);

        setActiveElectionsData(electionsResponse);
        setMyVotesData(votesResponse);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const verificationStatus = String(user?.verificationStatus || "pending");
  const verificationTone = getStatusTone(verificationStatus);
  const totalVotesCast = Number(myVotesData?.pagination?.totalItems || 0);
  const recentVotes = Array.isArray(myVotesData?.items)
    ? myVotesData.items
    : [];
  const activeElections = Array.isArray(activeElectionsData?.elections)
    ? activeElectionsData.elections
    : [];

  const readinessLabel = useMemo(() => {
    if (!user?.mobileVerified) return "Mobile verification pending";
    if (!user?.ageVerified) return "Age verification pending";
    if (!user?.isEligibleToVote) return "Eligibility not cleared";
    if (verificationStatus !== "approved") return "Admin approval pending";

    return "Ready to vote";
  }, [
    user?.mobileVerified,
    user?.ageVerified,
    user?.isEligibleToVote,
    verificationStatus,
  ]);

  return (
    <section className="voter-page">
      <div className="voter-hero">
        <div className="voter-hero__copy">
          <span className="voter-hero__badge">
            <ShieldCheck size={15} />
            Your voting access at a glance
          </span>

          <h2>Vote only when your status is clean and the election is live.</h2>

          <p>
            Good voter UX should remove confusion. First check your status. Then
            open only active elections. Then cast the vote carefully.
          </p>

          <div className="voter-hero__actions">
            <Link className="voter-primary-btn" to={APP_ROUTES.VOTER_ELECTIONS}>
              Open Active Elections
              <ArrowRight size={16} />
            </Link>

            <Link className="voter-secondary-btn" to={APP_ROUTES.VOTER_PROFILE}>
              Check Profile Status
            </Link>
          </div>
        </div>

        <div className="voter-hero__panel">
          <div
            className={`voter-status-card voter-status-card--${verificationTone}`}
          >
            <div className="voter-status-card__header">
              <strong>Verification Status</strong>
              <span>{verificationStatus}</span>
            </div>

            <p>{readinessLabel}</p>
          </div>

          <div className="voter-hero__mini-grid">
            <div className="voter-mini-card">
              <span>Eligible to vote</span>
              <strong>{user?.isEligibleToVote ? "Yes" : "No"}</strong>
            </div>

            <div className="voter-mini-card">
              <span>Mobile verified</span>
              <strong>{user?.mobileVerified ? "Yes" : "No"}</strong>
            </div>

            <div className="voter-mini-card">
              <span>Age verified</span>
              <strong>{user?.ageVerified ? "Yes" : "No"}</strong>
            </div>

            <div className="voter-mini-card">
              <span>Approval state</span>
              <strong>{verificationStatus}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="voter-stats-grid">
        <StatCard
          icon={Vote}
          label="Active Elections"
          value={loading ? "..." : activeElectionsData?.count || 0}
          helper="Currently available to open"
        />

        <StatCard
          icon={CheckCircle2}
          label="Votes Cast"
          value={loading ? "..." : totalVotesCast}
          helper="Recorded in your account"
        />

        <StatCard
          icon={BadgeCheck}
          label="Eligibility"
          value={user?.isEligibleToVote ? "Cleared" : "Blocked"}
          helper="Backend decides the final permission"
        />

        <StatCard
          icon={Clock3}
          label="Account Readiness"
          value={readinessLabel}
          helper="This decides whether voting will work"
        />
      </div>

      <div className="voter-grid">
        <section className="voter-panel">
          <div className="voter-panel__header">
            <div>
              <h3>Available Elections</h3>
              <p>Only active and allowed elections should appear here.</p>
            </div>

            <Link to={APP_ROUTES.VOTER_ELECTIONS}>View all</Link>
          </div>

          <div className="voter-panel__body">
            {loading ? (
              <div className="voter-empty-state">Loading elections...</div>
            ) : activeElections.length ? (
              <div className="voter-list">
                {activeElections.slice(0, 4).map((election) => (
                  <article key={election._id} className="voter-list-card">
                    <div>
                      <h4>{election.title}</h4>
                      <p>
                        {election.description ||
                          "No election description added yet."}
                      </p>
                    </div>

                    <Link
                      className="voter-inline-link"
                      to={`/voter/elections/${election._id}`}
                    >
                      Open ballot
                      <ArrowRight size={15} />
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="voter-empty-state">
                No active election is available for you right now.
              </div>
            )}
          </div>
        </section>

        <section className="voter-panel">
          <div className="voter-panel__header">
            <div>
              <h3>Recent Vote Activity</h3>
              <p>Quick review of your latest recorded vote entries.</p>
            </div>

            <Link to={APP_ROUTES.VOTER_MY_VOTES}>View all</Link>
          </div>

          <div className="voter-panel__body">
            {loading ? (
              <div className="voter-empty-state">Loading recent votes...</div>
            ) : recentVotes.length ? (
              <div className="voter-list">
                {recentVotes.map((vote) => (
                  <article key={vote._id} className="voter-list-card">
                    <div>
                      <h4>{vote?.candidateId?.fullName || "Candidate"}</h4>
                      <p>
                        {vote?.electionId?.title || "Election"} •{" "}
                        {vote?.postId?.title || "Post"}
                      </p>
                    </div>

                    <span className="voter-tag">Recorded</span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="voter-empty-state">
                You have not cast any vote yet.
              </div>
            )}
          </div>
        </section>
      </div>

      {verificationStatus === "rejected" && (
        <section className="voter-alert voter-alert--danger">
          <AlertTriangle size={18} />
          <div>
            <strong>Verification rejected</strong>
            <p>
              {user?.verificationRejectionReason ||
                "Your verification was rejected. Fix the issue before expecting the voting flow to work."}
            </p>
          </div>
        </section>
      )}

      {verificationStatus === "pending" && (
        <section className="voter-alert voter-alert--warning">
          <AlertTriangle size={18} />
          <div>
            <strong>Approval still pending</strong>
            <p>
              Your account may be blocked from voting until admin approval is
              completed.
            </p>
          </div>
        </section>
      )}

      <section className="voter-panel">
        <div className="voter-panel__header">
          <div>
            <h3>Profile Snapshot</h3>
            <p>
              Core identity and voting-related status pulled from your account.
            </p>
          </div>
        </div>

        <div className="voter-profile-grid">
          <div className="voter-profile-item">
            <UserCircle2 size={18} />
            <div>
              <span>Full Name</span>
              <strong>{user?.fullName || "-"}</strong>
            </div>
          </div>

          <div className="voter-profile-item">
            <ShieldCheck size={18} />
            <div>
              <span>Email</span>
              <strong>{user?.email || "-"}</strong>
            </div>
          </div>

          <div className="voter-profile-item">
            <Vote size={18} />
            <div>
              <span>Mobile Number</span>
              <strong>{user?.mobileNumber || "-"}</strong>
            </div>
          </div>

          <div className="voter-profile-item">
            <CheckCircle2 size={18} />
            <div>
              <span>Internal Voter ID</span>
              <strong>{user?.internalVoterId || "Not assigned yet"}</strong>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
