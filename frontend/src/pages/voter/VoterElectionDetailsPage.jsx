import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  TimerReset,
  UserCircle2,
  Vote,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { voterService } from "../../services/voter.service";
import { voteService } from "../../services/vote.service";
import { APP_ROUTES } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/voter.css";
import "../../styles/voter-clean-pages.css";

const VOTES_PAGE_LIMIT = 10;

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "candidates", label: "Posts & Candidates" },
  { id: "myVotes", label: "My Votes" },
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

function formatLabel(value = "") {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function getReadiness(user) {
  if (!user?.mobileVerified) {
    return {
      canVote: false,
      title: "Mobile verification pending",
      message: "Your mobile number must be verified before you can vote.",
    };
  }

  if (!user?.ageVerified) {
    return {
      canVote: false,
      title: "Age verification pending",
      message: "Your age verification is still pending.",
    };
  }

  if (!user?.isEligibleToVote) {
    return {
      canVote: false,
      title: "Voting restricted",
      message: "Your account is not currently eligible to vote.",
    };
  }

  if (String(user?.verificationStatus || "").toLowerCase() !== "approved") {
    return {
      canVote: false,
      title: "Admin approval pending",
      message:
        "Administrative approval is still required before voting is enabled.",
    };
  }

  return {
    canVote: true,
    title: "Voter verified",
    message: "Your account is verified. Voting depends on election status.",
  };
}

function getCandidateApproval(candidate) {
  return (
    Boolean(candidate?.isApproved) &&
    String(candidate?.approvalStatus || "").toLowerCase() === "approved"
  );
}

function PaginationControls({
  page,
  totalPages,
  hasPrevPage,
  hasNextPage,
  onPrev,
  onNext,
}) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="vcp-toolbar">
      <span className="vcp-status-chip">
        Page {page} of {totalPages}
      </span>

      <div className="voter-hero__actions">
        <button
          type="button"
          className="voter-secondary-btn"
          onClick={onPrev}
          disabled={!hasPrevPage}
        >
          Previous
        </button>

        <button
          type="button"
          className="voter-primary-btn"
          onClick={onNext}
          disabled={!hasNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function VoterElectionDetailsPage() {
  const { electionId } = useParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [activePostId, setActivePostId] = useState("");
  const [myVotesPage, setMyVotesPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [submittingVoteId, setSubmittingVoteId] = useState("");

  const [election, setElection] = useState(null);
  const [canVoteNow, setCanVoteNow] = useState(false);
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);

  const readiness = useMemo(() => getReadiness(user), [user]);

  const loadAllVotesForThisElection = useCallback(async () => {
    const collectedVotes = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await voteService.getMyVotes({
        page,
        limit: VOTES_PAGE_LIMIT,
      });

      const items = Array.isArray(response?.items) ? response.items : [];

      collectedVotes.push(
        ...items.filter((vote) => vote?.electionId?._id === electionId),
      );

      hasNextPage = Boolean(response?.pagination?.hasNextPage);
      page += 1;
    }

    return collectedVotes;
  }, [electionId]);

  const loadElectionPage = useCallback(async () => {
    if (!electionId) return;

    try {
      setLoading(true);

      const [publishedElectionResponse, postCandidateResponse, electionVotes] =
        await Promise.all([
          voterService.getPublishedElections(),
          voterService.getElectionPostsWithCandidates(electionId),
          loadAllVotesForThisElection(),
        ]);

      const matchedElectionFromList =
        Array.isArray(publishedElectionResponse?.elections) &&
        publishedElectionResponse.elections.find(
          (item) => item?._id === electionId,
        );

      const normalizedPosts = Array.isArray(postCandidateResponse?.posts)
        ? postCandidateResponse.posts
        : [];

      setElection(
        postCandidateResponse?.election || matchedElectionFromList || null,
      );

      setCanVoteNow(Boolean(postCandidateResponse?.canVoteNow));
      setPosts(normalizedPosts);
      setVotes(electionVotes);

      setActivePostId((currentPostId) => {
        if (
          currentPostId &&
          normalizedPosts.some((post) => post?._id === currentPostId)
        ) {
          return currentPostId;
        }

        return normalizedPosts?.[0]?._id || "";
      });

      setMyVotesPage(1);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setElection(null);
      setCanVoteNow(false);
      setPosts([]);
      setVotes([]);
      setActivePostId("");
      setMyVotesPage(1);
    } finally {
      setLoading(false);
    }
  }, [electionId, loadAllVotesForThisElection]);

  useEffect(() => {
    loadElectionPage();
  }, [loadElectionPage]);

  const votesByPost = useMemo(() => {
    const map = new Map();

    for (const vote of votes) {
      const postId = vote?.postId?._id;
      if (!postId) continue;

      const existing = map.get(postId) || {
        count: 0,
        candidateIds: new Set(),
      };

      existing.count += 1;

      if (vote?.candidateId?._id) {
        existing.candidateIds.add(vote.candidateId._id);
      }

      map.set(postId, existing);
    }

    return map;
  }, [votes]);

  const activePost = useMemo(() => {
    return posts.find((post) => post?._id === activePostId) || posts[0] || null;
  }, [activePostId, posts]);

  const totalCandidates = useMemo(() => {
    return posts.reduce((total, post) => {
      const candidates = Array.isArray(post?.candidates) ? post.candidates : [];
      return total + candidates.length;
    }, 0);
  }, [posts]);

  const approvedCandidates = useMemo(() => {
    return posts.reduce((total, post) => {
      const candidates = Array.isArray(post?.candidates) ? post.candidates : [];
      return total + candidates.filter(getCandidateApproval).length;
    }, 0);
  }, [posts]);

  const totalRemainingVotes = useMemo(() => {
    if (!canVoteNow) return 0;

    return posts.reduce((sum, post) => {
      const used = votesByPost.get(post._id)?.count || 0;
      const maxVotes = Number(post?.maxVotesPerVoter || 1);
      return sum + Math.max(maxVotes - used, 0);
    }, 0);
  }, [canVoteNow, posts, votesByPost]);

  const myVotesPagination = useMemo(() => {
    const totalItems = votes.length;
    const totalPages = Math.max(Math.ceil(totalItems / VOTES_PAGE_LIMIT), 1);
    const safePage = Math.min(Math.max(myVotesPage, 1), totalPages);
    const startIndex = (safePage - 1) * VOTES_PAGE_LIMIT;
    const endIndex = startIndex + VOTES_PAGE_LIMIT;

    return {
      currentPage: safePage,
      totalPages,
      hasPrevPage: safePage > 1,
      hasNextPage: safePage < totalPages,
      items: votes.slice(startIndex, endIndex),
    };
  }, [myVotesPage, votes]);

  const electionStatusLabel = formatLabel(election?.status || "upcoming");

  const canCastVoteInThisElection = readiness.canVote && canVoteNow;

  const votingStatusMessage = canVoteNow
    ? readiness.message
    : "Voting is locked because this election has not started yet.";

  const handleVote = async ({ postId, candidateId }) => {
    if (!readiness.canVote) {
      toast.error(readiness.message);
      return;
    }

    if (!canVoteNow) {
      toast.error("Voting will open when this election becomes active.");
      return;
    }

    const buttonKey = `${postId}:${candidateId}`;

    try {
      setSubmittingVoteId(buttonKey);

      const response = await voteService.castVote({
        electionId,
        postId,
        candidateId,
      });

      toast.success(response?.message || "Vote submitted successfully.");
      await loadElectionPage();
      setActiveTab("myVotes");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmittingVoteId("");
    }
  };

  return (
    <section className="voter-page vcp-page">
      <div className="vcp-back-row">
        <Link className="vcp-back-link" to={APP_ROUTES.VOTER_ELECTIONS}>
          <ArrowLeft size={16} />
          Back to elections
        </Link>
      </div>

      <section className="vcp-hero vcp-hero--ballot">
        <div>
          <span className="vcp-eyebrow">Election details</span>
          <h2>{election?.title || "Election Details"}</h2>
          <p>
            You can view posts and candidates before the election starts. Voting
            becomes available only when the election status is active.
          </p>
        </div>

        <div
          className={
            canCastVoteInThisElection
              ? "vcp-readiness vcp-readiness--success"
              : "vcp-readiness vcp-readiness--warning"
          }
        >
          {canCastVoteInThisElection ? (
            <ShieldCheck size={18} />
          ) : election?.status === "upcoming" ? (
            <TimerReset size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}

          <div>
            <strong>
              {canCastVoteInThisElection
                ? "Voting open"
                : election?.status === "upcoming"
                  ? "Upcoming election"
                  : readiness.title}
            </strong>
            <span>{votingStatusMessage}</span>
          </div>
        </div>
      </section>

      <div className="vcp-tabs" role="tablist" aria-label="Election details">
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

      {loading ? (
        <div className="vcp-empty vcp-empty--large">
          Loading election details...
        </div>
      ) : !election ? (
        <div className="vcp-empty vcp-empty--large">
          Election details are not available for voters.
        </div>
      ) : (
        <>
          {activeTab === "overview" && (
            <div className="vcp-tab-panel">
              <div className="vcp-metric-grid">
                <article className="vcp-metric-card vcp-metric-card--green">
                  <Vote size={20} />
                  <span>Total Posts</span>
                  <strong>{posts.length}</strong>
                </article>

                <article className="vcp-metric-card vcp-metric-card--violet">
                  <UserCircle2 size={20} />
                  <span>Visible Candidates</span>
                  <strong>
                    {approvedCandidates}/{totalCandidates}
                  </strong>
                </article>

                <article className="vcp-metric-card vcp-metric-card--amber">
                  <CheckCircle2 size={20} />
                  <span>Your Votes</span>
                  <strong>{votes.length}</strong>
                </article>

                <article className="vcp-metric-card vcp-metric-card--rose">
                  <BadgeCheck size={20} />
                  <span>Remaining Votes</span>
                  <strong>{canVoteNow ? totalRemainingVotes : "Locked"}</strong>
                </article>
              </div>

              <section className="vcp-card">
                <div className="vcp-card-header">
                  <div>
                    <h3>Election summary</h3>
                    <p>Main election information in readable format.</p>
                  </div>

                  <span
                    className={
                      election?.status === "active"
                        ? "vcp-status-chip"
                        : "status-chip status-chip--amber"
                    }
                  >
                    {electionStatusLabel}
                  </span>
                </div>

                <p className="vcp-description">
                  {election?.description ||
                    "No election description is available at the moment."}
                </p>

                {election?.status === "upcoming" ? (
                  <div className="voter-upcoming-note">
                    This election has not started yet. You can view posts and
                    candidates now, but voting will open on the start date.
                  </div>
                ) : null}

                <div className="vcp-info-grid">
                  <div>
                    <CalendarClock size={16} />
                    <span>Start date</span>
                    <strong>{formatDate(election?.startDate)}</strong>
                  </div>

                  <div>
                    <Clock3 size={16} />
                    <span>End date</span>
                    <strong>{formatDate(election?.endDate)}</strong>
                  </div>

                  <div>
                    <ShieldCheck size={16} />
                    <span>Access type</span>
                    <strong>
                      {election?.allowedVoterType === "all"
                        ? "All voters"
                        : "Verified only"}
                    </strong>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "candidates" && (
            <div className="vcp-tab-panel">
              {posts.length ? (
                <>
                  <section className="vcp-card">
                    <div className="vcp-card-header">
                      <div>
                        <h3>Select post</h3>
                        <p>
                          Posts and candidates are visible before voting opens.
                          Vote buttons remain locked until election becomes
                          active.
                        </p>
                      </div>
                    </div>

                    <div className="vcp-post-options">
                      {posts.map((post) => {
                        const voteData = votesByPost.get(post._id) || {
                          count: 0,
                        };
                        const maxVotes = Number(post?.maxVotesPerVoter || 1);
                        const remaining = canVoteNow
                          ? Math.max(maxVotes - voteData.count, 0)
                          : 0;

                        return (
                          <button
                            key={post._id}
                            type="button"
                            className={
                              activePost?._id === post._id ? "is-active" : ""
                            }
                            onClick={() => setActivePostId(post._id)}
                          >
                            <strong>{post?.title || "Post"}</strong>
                            <span>
                              {canVoteNow
                                ? `Used ${voteData.count || 0}/${maxVotes} • Remaining ${remaining}`
                                : "Preview only • Voting not started"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {activePost ? (
                    <section className="vcp-card">
                      <div className="vcp-card-header">
                        <div>
                          <h3>{activePost?.title || "Post"}</h3>
                          <p>
                            {activePost?.description ||
                              "No description is available for this post."}
                          </p>
                        </div>

                        {!canVoteNow ? (
                          <span className="status-chip status-chip--amber">
                            Preview mode
                          </span>
                        ) : null}
                      </div>

                      <CandidateGrid
                        post={activePost}
                        voteData={
                          votesByPost.get(activePost._id) || {
                            count: 0,
                            candidateIds: new Set(),
                          }
                        }
                        readiness={readiness}
                        canVoteNow={canVoteNow}
                        submittingVoteId={submittingVoteId}
                        onVote={handleVote}
                      />
                    </section>
                  ) : null}
                </>
              ) : (
                <div className="vcp-empty vcp-empty--large">
                  No active posts are currently available in this election.
                </div>
              )}
            </div>
          )}

          {activeTab === "myVotes" && (
            <div className="vcp-tab-panel">
              <section className="vcp-card">
                <div className="vcp-card-header">
                  <div>
                    <h3>My votes in this election</h3>
                    <p>
                      Showing {VOTES_PAGE_LIMIT} records per page for better
                      performance and cleaner UI.
                    </p>
                  </div>

                  <span className="vcp-status-chip">
                    {votes.length} recorded
                  </span>
                </div>

                {myVotesPagination.items.length ? (
                  <div className="vcp-vote-list">
                    {myVotesPagination.items.map((vote) => (
                      <VoteRow key={vote._id} vote={vote} />
                    ))}
                  </div>
                ) : (
                  <div className="vcp-empty">
                    You have not voted in this election yet.
                  </div>
                )}
              </section>

              <PaginationControls
                page={myVotesPagination.currentPage}
                totalPages={myVotesPagination.totalPages}
                hasPrevPage={myVotesPagination.hasPrevPage}
                hasNextPage={myVotesPagination.hasNextPage}
                onPrev={() => setMyVotesPage((page) => Math.max(page - 1, 1))}
                onNext={() =>
                  setMyVotesPage((page) =>
                    Math.min(page + 1, myVotesPagination.totalPages),
                  )
                }
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

function CandidateGrid({
  post,
  voteData,
  readiness,
  canVoteNow,
  submittingVoteId,
  onVote,
}) {
  const candidates = Array.isArray(post?.candidates) ? post.candidates : [];
  const usedVotes = voteData?.count || 0;
  const maxVotes = Number(post?.maxVotesPerVoter || 1);
  const remainingVotes = canVoteNow ? Math.max(maxVotes - usedVotes, 0) : 0;

  if (!candidates.length) {
    return (
      <div className="vcp-empty">
        No approved candidates are available for this post.
      </div>
    );
  }

  return (
    <div className="vcp-candidate-grid">
      {candidates.map((candidate) => {
        const alreadyVotedForCandidate = voteData?.candidateIds?.has(
          candidate._id,
        );
        const candidateApproved = getCandidateApproval(candidate);

        const voteBlocked =
          !canVoteNow ||
          !readiness.canVote ||
          !candidateApproved ||
          alreadyVotedForCandidate ||
          remainingVotes <= 0;

        let voteLabel = "Submit Vote";

        if (!canVoteNow) {
          voteLabel = "Voting opens later";
        } else if (!readiness.canVote) {
          voteLabel = "Voting locked";
        } else if (!candidateApproved) {
          voteLabel = "Approval pending";
        } else if (alreadyVotedForCandidate) {
          voteLabel = "Already voted";
        } else if (remainingVotes <= 0) {
          voteLabel = "Vote limit reached";
        }

        const buttonKey = `${post._id}:${candidate._id}`;
        const isSubmitting = submittingVoteId === buttonKey;

        return (
          <article
            key={candidate._id}
            className={
              alreadyVotedForCandidate
                ? "vcp-candidate-card vcp-candidate-card--selected"
                : "vcp-candidate-card"
            }
          >
            <div className="vcp-candidate-card__top">
              <div className="vcp-candidate-card__avatar">
                {candidate?.candidatePhotoUrl ? (
                  <img
                    src={candidate.candidatePhotoUrl}
                    alt={candidate?.fullName || "Candidate"}
                  />
                ) : (
                  <UserCircle2 size={28} />
                )}
              </div>

              <div>
                <h4>{candidate?.fullName || "Candidate"}</h4>
                <p>{candidate?.partyName || "Independent"}</p>
              </div>
            </div>

            <div className="vcp-chip-row">
              <span className="vcp-small-chip">
                {candidate?.partyName || "Independent"}
              </span>

              <span
                className={
                  candidateApproved
                    ? "vcp-small-chip vcp-small-chip--success"
                    : "vcp-small-chip vcp-small-chip--warning"
                }
              >
                {candidateApproved ? "Approved" : "Pending"}
              </span>

              {!canVoteNow ? (
                <span className="vcp-small-chip vcp-small-chip--warning">
                  Preview only
                </span>
              ) : null}

              {alreadyVotedForCandidate ? (
                <span className="vcp-small-chip vcp-small-chip--success">
                  Vote recorded
                </span>
              ) : null}
            </div>

            <div className="vcp-manifesto">
              <div>
                <FileText size={15} />
                <strong>Manifesto</strong>
              </div>

              <p>
                {candidate?.manifesto ||
                  candidate?.bio ||
                  "No manifesto or profile summary is available."}
              </p>
            </div>

            <button
              type="button"
              className="vcp-primary-btn"
              onClick={() =>
                onVote({
                  postId: post._id,
                  candidateId: candidate._id,
                })
              }
              disabled={voteBlocked || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : voteLabel}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function VoteRow({ vote }) {
  return (
    <article className="vcp-vote-row">
      <div className="vcp-vote-row__icon">
        <CheckCircle2 size={17} />
      </div>

      <div>
        <h4>{vote?.candidateId?.fullName || "Candidate"}</h4>
        <p>
          {vote?.postId?.title || "Post"} •{" "}
          {vote?.candidateId?.partyName || "Independent"}
        </p>
      </div>

      <span>{formatDate(vote?.createdAt)}</span>
    </article>
  );
}
