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
  RefreshCcw,
  FileText,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { voterService } from "../../services/voter.service";
import { voteService } from "../../services/vote.service";
import { APP_ROUTES, buildVoterElectionDetailsRoute } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";
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

function getReadiness(user) {
  if (!user?.mobileVerified) {
    return {
      canVote: false,
      message: "Your mobile number must be verified before you can vote.",
    };
  }

  if (!user?.ageVerified) {
    return {
      canVote: false,
      message: "Your age verification is still pending.",
    };
  }

  if (!user?.isEligibleToVote) {
    return {
      canVote: false,
      message: "Your account is not currently eligible to vote.",
    };
  }

  if (String(user?.verificationStatus || "").toLowerCase() !== "approved") {
    return {
      canVote: false,
      message:
        "Administrative approval is still required before voting is enabled.",
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
      setElection(null);
      setPosts([]);
      setVotes([]);
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

  const totalRemainingVotes = useMemo(() => {
    return posts.reduce((sum, post) => {
      const used = votesByPost.get(post._id)?.count || 0;
      const maxVotes = Number(post?.maxVotesPerVoter || 1);
      return sum + Math.max(maxVotes - used, 0);
    }, 0);
  }, [posts, votesByPost]);

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

      toast.success(response?.message || "Vote submitted successfully.");
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

          <h2>{election?.title || "Election Details"}</h2>
          <p>
            Review the posts and candidates available in this election before
            submitting your vote.
          </p>
        </div>
      </div>

      {!readiness.canVote && (
        <section className="voter-alert voter-alert--warning">
          <AlertTriangle size={18} />
          <div>
            <strong>Voting is currently unavailable</strong>
            <p>{readiness.message}</p>
          </div>
        </section>
      )}

      {loading ? (
        <div className="voter-empty-state voter-empty-state--lg">
          Loading election details...
        </div>
      ) : !election ? (
        <div className="voter-empty-state voter-empty-state--lg">
          Election details are not available in the current active election
          feed.
        </div>
      ) : (
        <>
          <section className="voter-election-hero">
            <div className="voter-election-hero__main">
              <span className="voter-hero__badge">
                <Vote size={14} />
                Active Ballot
              </span>

              <h3>{election?.title || "Election details"}</h3>

              <p>
                {election?.description ||
                  "No election description is available at the moment."}
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
                <span>Remaining Vote Capacity</span>
                <strong>{totalRemainingVotes}</strong>
              </div>

              <div className="voter-mini-card">
                <span>Account Status</span>
                <strong>{readiness.canVote ? "Ready" : "Restricted"}</strong>
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
                const candidates = Array.isArray(post?.candidates)
                  ? post.candidates
                  : [];

                return (
                  <section key={post._id} className="voter-post-panel">
                    <div className="voter-post-panel__header">
                      <div>
                        <h3>{post.title}</h3>
                        <p>
                          {post.description ||
                            "No description is available for this post."}
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

                    {candidates.length ? (
                      <div className="voter-candidate-grid">
                        {candidates.map((candidate) => {
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

                          let voteLabel = "Submit Vote";

                          if (!candidateApproved) {
                            voteLabel = "Approval Pending";
                          } else if (alreadyVotedForCandidate) {
                            voteLabel = "Already Voted";
                          } else if (remainingVotes <= 0) {
                            voteLabel = "Vote Limit Reached";
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
                                    Vote recorded
                                  </span>
                                ) : null}
                              </div>

                              <div className="voter-candidate-card__manifesto">
                                <div className="voter-candidate-card__manifesto-title">
                                  <FileText size={15} />
                                  <strong>Manifesto</strong>
                                </div>

                                <p className="voter-candidate-card__bio">
                                  {candidate?.manifesto ||
                                    candidate?.bio ||
                                    "No manifesto or profile summary is available."}
                                </p>
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
                        No candidates are currently available for this post.
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="voter-empty-state voter-empty-state--lg">
              No active posts are currently available in this election.
            </div>
          )}

          <section className="voter-panel">
            <div className="voter-panel__header">
              <div>
                <h3>Quick Navigation</h3>
                <p>
                  Use these shortcuts to move between election-related pages.
                </p>
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
                <RefreshCcw size={15} />
                Refresh this page
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
