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
  ShieldCheck,
  UserCircle2,
  Vote,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { voterService } from "../../services/voter.service";
import { voteService } from "../../services/vote.service";
import { APP_ROUTES, buildVoterElectionDetailsRoute } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";

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

function getReadiness(user) {
  if (!user?.mobileVerified) {
    return {
      canVote: false,
      message: "Mobile verification is pending.",
    };
  }

  if (!user?.ageVerified) {
    return {
      canVote: false,
      message: "Age verification is pending.",
    };
  }

  if (!user?.isEligibleToVote) {
    return {
      canVote: false,
      message: "Your account is not eligible to vote.",
    };
  }

  if (String(user?.verificationStatus || "").toLowerCase() !== "approved") {
    return {
      canVote: false,
      message: "Admin approval is pending or rejected.",
    };
  }

  return {
    canVote: true,
    message: "Your account is ready for voting.",
  };
}

export default function VoterElectionDetailsPage() {
  const { electionId } = useParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submittingVoteId, setSubmittingVoteId] = useState("");
  const [election, setElection] = useState(null);
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);

  const readiness = useMemo(() => getReadiness(user), [user]);

  const loadElectionPage = useCallback(async () => {
    if (!electionId) return;

    try {
      setLoading(true);

      const [electionListResponse, postsResponse, votesResponse] =
        await Promise.all([
          voterService.getActiveElections(),
          voterService.getElectionPostsWithCandidates(electionId),
          voteService.getMyVotes({ page: 1, limit: 500 }),
        ]);

      const matchedElection =
        Array.isArray(electionListResponse?.elections) &&
        electionListResponse.elections.find((item) => item?._id === electionId);

      setElection(matchedElection || null);
      setPosts(Array.isArray(postsResponse) ? postsResponse : []);
      setVotes(
        Array.isArray(votesResponse?.items)
          ? votesResponse.items.filter(
              (vote) => vote?.electionId?._id === electionId,
            )
          : [],
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [electionId]);

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

  const handleVote = async ({ postId, candidateId }) => {
    if (!readiness.canVote) {
      toast.error(readiness.message);
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

      toast.success(response?.message || "Vote cast successfully");
      await loadElectionPage();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmittingVoteId("");
    }
  };

  return (
    <section className="voter-page">
      <div className="voter-section-heading voter-section-heading--with-back">
        <div>
          <Link className="voter-back-link" to={APP_ROUTES.VOTER_ELECTIONS}>
            <ArrowLeft size={16} />
            Back to elections
          </Link>

          <h2>{election?.title || "Election Voting"}</h2>
          <p>
            Ye page real ballot room hai. Yahin se post-wise candidate select
            karke vote cast hoga.
          </p>
        </div>
      </div>

      {!readiness.canVote && (
        <section className="voter-alert voter-alert--warning">
          <AlertTriangle size={18} />
          <div>
            <strong>Voting is currently blocked</strong>
            <p>{readiness.message}</p>
          </div>
        </section>
      )}

      {loading ? (
        <div className="voter-empty-state voter-empty-state--lg">
          Loading election details...
        </div>
      ) : (
        <>
          <section className="voter-election-hero">
            <div className="voter-election-hero__main">
              <span className="voter-hero__badge">
                <Vote size={14} />
                Active ballot
              </span>

              <h3>{election?.title || "Election details loaded"}</h3>

              <p>
                {election?.description ||
                  "Election description was not found in the active election payload."}
              </p>

              <div className="voter-election-hero__meta">
                <span>
                  <CalendarClock size={15} />
                  Start: {formatDate(election?.startDate)}
                </span>

                <span>
                  <Clock3 size={15} />
                  End: {formatDate(election?.endDate)}
                </span>

                <span>
                  <ShieldCheck size={15} />
                  Status: {election?.status || "active"}
                </span>
              </div>
            </div>

            <div className="voter-election-hero__summary">
              <div className="voter-mini-card">
                <span>Total Posts</span>
                <strong>{posts.length}</strong>
              </div>

              <div className="voter-mini-card">
                <span>Your Votes In This Election</span>
                <strong>{votes.length}</strong>
              </div>

              <div className="voter-mini-card">
                <span>Account State</span>
                <strong>{readiness.canVote ? "Ready" : "Blocked"}</strong>
              </div>
            </div>
          </section>

          {posts.length ? (
            <div className="voter-post-stack">
              {posts.map((post) => {
                const postVoteData = votesByPost.get(post._id) || {
                  count: 0,
                  candidateIds: new Set(),
                };

                const usedVotes = postVoteData.count;
                const maxVotes = Number(post?.maxVotesPerVoter || 1);
                const remainingVotes = Math.max(maxVotes - usedVotes, 0);
                const approvedCandidates = Array.isArray(post?.candidates)
                  ? post.candidates
                  : [];

                return (
                  <section key={post._id} className="voter-post-panel">
                    <div className="voter-post-panel__header">
                      <div>
                        <h3>{post.title}</h3>
                        <p>
                          {post.description ||
                            "No post description is available for this ballot section."}
                        </p>
                      </div>

                      <div className="voter-post-panel__metrics">
                        <div className="voter-metric-pill">
                          <BadgeCheck size={15} />
                          Max: {maxVotes}
                        </div>

                        <div className="voter-metric-pill">
                          <CheckCircle2 size={15} />
                          Used: {usedVotes}
                        </div>

                        <div className="voter-metric-pill">
                          <Vote size={15} />
                          Remaining: {remainingVotes}
                        </div>
                      </div>
                    </div>

                    {approvedCandidates.length ? (
                      <div className="voter-candidate-grid">
                        {approvedCandidates.map((candidate) => {
                          const alreadyVotedForCandidate =
                            postVoteData.candidateIds.has(candidate._id);

                          const candidateApproved =
                            candidate?.isApproved &&
                            String(
                              candidate?.approvalStatus || "",
                            ).toLowerCase() === "approved";

                          const voteBlocked =
                            !readiness.canVote ||
                            !candidateApproved ||
                            alreadyVotedForCandidate ||
                            remainingVotes <= 0;

                          let voteLabel = "Vote now";

                          if (!candidateApproved) {
                            voteLabel = "Pending approval";
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
                              className={`voter-candidate-card ${
                                alreadyVotedForCandidate
                                  ? "voter-candidate-card--selected"
                                  : ""
                              }`}
                            >
                              <div className="voter-candidate-card__top">
                                <div className="voter-candidate-card__avatar">
                                  {candidate?.candidatePhotoUrl ? (
                                    <img
                                      src={candidate.candidatePhotoUrl}
                                      alt={candidate?.fullName || "Candidate"}
                                    />
                                  ) : (
                                    <UserCircle2 size={28} />
                                  )}
                                </div>

                                <div className="voter-candidate-card__identity">
                                  <h4>{candidate?.fullName || "Candidate"}</h4>
                                  <p>{candidate?.partyName || "Independent"}</p>
                                </div>
                              </div>

                              {candidate?.bio ? (
                                <p className="voter-candidate-card__bio">
                                  {candidate.bio}
                                </p>
                              ) : (
                                <p className="voter-candidate-card__bio">
                                  No candidate bio added yet.
                                </p>
                              )}

                              <div className="voter-candidate-card__badges">
                                <span className="voter-tag">
                                  {candidate?.partyName || "Independent"}
                                </span>

                                <span
                                  className={`voter-tag ${
                                    candidateApproved
                                      ? "voter-tag--success"
                                      : "voter-tag--warning"
                                  }`}
                                >
                                  {candidateApproved ? "Approved" : "Pending"}
                                </span>

                                {alreadyVotedForCandidate ? (
                                  <span className="voter-tag voter-tag--soft">
                                    Your vote recorded
                                  </span>
                                ) : null}
                              </div>

                              <button
                                type="button"
                                className="voter-primary-btn voter-primary-btn--full"
                                onClick={() =>
                                  handleVote({
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
                    ) : (
                      <div className="voter-empty-state">
                        No candidates are available in this post right now.
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="voter-empty-state voter-empty-state--lg">
              This election has no active posts for the voter side yet.
            </div>
          )}

          <section className="voter-panel">
            <div className="voter-panel__header">
              <div>
                <h3>Quick Exit Paths</h3>
                <p>Keep navigation obvious. Hidden navigation is bad UX.</p>
              </div>
            </div>

            <div className="voter-action-row">
              <Link
                className="voter-secondary-btn"
                to={APP_ROUTES.VOTER_ELECTIONS}
              >
                Back to all elections
              </Link>

              <Link
                className="voter-secondary-btn"
                to={buildVoterElectionDetailsRoute(electionId)}
              >
                Refresh this ballot
              </Link>

              <Link
                className="voter-secondary-btn"
                to={APP_ROUTES.VOTER_MY_VOTES}
              >
                View my votes
              </Link>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
