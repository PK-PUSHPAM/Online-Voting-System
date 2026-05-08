import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Award,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Crown,
  FileBarChart2,
  Trophy,
  UsersRound,
} from "lucide-react";
import { resultService } from "../../services/result.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/voter.css";
import "../../styles/voter-clean-pages.css";

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

function getPercent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total || 0)) * 100);
}

export default function VoterResultsPage() {
  const [loadingElections, setLoadingElections] = useState(true);
  const [loadingResult, setLoadingResult] = useState(false);
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    const loadResultElections = async () => {
      try {
        setLoadingElections(true);

        const data = await resultService.getVoterResultElections();
        const normalizedElections = Array.isArray(data?.elections)
          ? data.elections
          : [];

        setElections(normalizedElections);
        setSelectedElectionId(normalizedElections?.[0]?._id || "");
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        setElections([]);
        setSelectedElectionId("");
      } finally {
        setLoadingElections(false);
      }
    };

    loadResultElections();
  }, []);

  useEffect(() => {
    if (!selectedElectionId) {
      setResultData(null);
      return;
    }

    const loadElectionResult = async () => {
      try {
        setLoadingResult(true);

        const data =
          await resultService.getVoterElectionResults(selectedElectionId);

        setResultData(data || null);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        setResultData(null);
      } finally {
        setLoadingResult(false);
      }
    };

    loadElectionResult();
  }, [selectedElectionId]);

  const selectedElection = useMemo(() => {
    return (
      elections.find((election) => election?._id === selectedElectionId) || null
    );
  }, [elections, selectedElectionId]);

  const totalWinners = useMemo(() => {
    const results = Array.isArray(resultData?.results)
      ? resultData.results
      : [];
    return results.filter((item) => item?.winner?._id).length;
  }, [resultData]);

  const totalTies = useMemo(() => {
    const results = Array.isArray(resultData?.results)
      ? resultData.results
      : [];
    return results.filter((item) => item?.isTie).length;
  }, [resultData]);

  return (
    <section className="voter-page vcp-page">
      <section className="vcp-hero vcp-hero--results">
        <div>
          <span className="vcp-eyebrow">Final result center</span>
          <h2>Election Results</h2>
          <p>
            View final results for completed published elections. Results are
            visible only after an election officially ends.
          </p>
        </div>

        <div className="vcp-history-summary">
          <div>
            <Trophy size={18} />
            <span>Ended elections</span>
            <strong>{loadingElections ? "..." : elections.length}</strong>
          </div>

          <div>
            <Award size={18} />
            <span>Winners</span>
            <strong>{loadingResult ? "..." : totalWinners}</strong>
          </div>
        </div>
      </section>

      <section className="vcp-card">
        <div className="vcp-card-header">
          <div>
            <h3>Select completed election</h3>
            <p>Choose an ended election to inspect post-wise final results.</p>
          </div>

          <span className="vcp-status-chip">Final results only</span>
        </div>

        {loadingElections ? (
          <div className="vcp-empty">Loading result elections...</div>
        ) : elections.length ? (
          <div className="vpr-election-picker">
            <label>
              <span>Election</span>
              <select
                value={selectedElectionId}
                onChange={(event) => setSelectedElectionId(event.target.value)}
              >
                {elections.map((election) => (
                  <option key={election._id} value={election._id}>
                    {election.title}
                  </option>
                ))}
              </select>
            </label>

            {selectedElection ? (
              <div className="vpr-selected-election">
                <CalendarClock size={17} />
                <div>
                  <strong>{selectedElection.title}</strong>
                  <span>Ended: {formatDate(selectedElection.endDate)}</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="vcp-empty">
            No completed published election result is available yet.
          </div>
        )}
      </section>

      {loadingResult ? (
        <div className="vcp-empty vcp-empty--large">
          Loading final result...
        </div>
      ) : resultData ? (
        <div className="vcp-tab-panel">
          <div className="vcp-metric-grid">
            <article className="vcp-metric-card vcp-metric-card--green">
              <FileBarChart2 size={20} />
              <span>Total Posts</span>
              <strong>{resultData?.totalPosts || 0}</strong>
            </article>

            <article className="vcp-metric-card vcp-metric-card--violet">
              <BarChart3 size={20} />
              <span>Total Votes</span>
              <strong>{resultData?.totalVotesCast || 0}</strong>
            </article>

            <article className="vcp-metric-card vcp-metric-card--amber">
              <Crown size={20} />
              <span>Declared Winners</span>
              <strong>{totalWinners}</strong>
            </article>

            <article className="vcp-metric-card vcp-metric-card--rose">
              <UsersRound size={20} />
              <span>Tied Posts</span>
              <strong>{totalTies}</strong>
            </article>
          </div>

          <section className="vcp-card">
            <div className="vcp-card-header">
              <div>
                <h3>{resultData?.election?.title || "Election Result"}</h3>
                <p>
                  Final result generated from completed vote records. Candidate
                  ranking is post-wise.
                </p>
              </div>

              <span className="vcp-status-chip">Final</span>
            </div>

            <div className="vpr-result-stack">
              {(Array.isArray(resultData?.results)
                ? resultData.results
                : []
              ).map((postResult) => (
                <PostResultCard
                  key={postResult?.post?._id}
                  postResult={postResult}
                />
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function PostResultCard({ postResult }) {
  const candidates = Array.isArray(postResult?.candidates)
    ? postResult.candidates
    : [];

  return (
    <article className="vpr-post-card">
      <div className="vpr-post-card__header">
        <div>
          <h4>{postResult?.post?.title || "Post"}</h4>
          <p>
            {postResult?.post?.description ||
              "No post description is available."}
          </p>
        </div>

        <span>
          {postResult?.totalVotesCastForPost || 0} vote
          {Number(postResult?.totalVotesCastForPost || 0) === 1 ? "" : "s"}
        </span>
      </div>

      {postResult?.winner ? (
        <div className="vpr-winner-box">
          <Crown size={18} />
          <div>
            <strong>{postResult.winner.fullName}</strong>
            <span>
              Winner • {postResult.winner.partyName || "Independent"} •{" "}
              {postResult.winner.totalVotes} votes
            </span>
          </div>
        </div>
      ) : postResult?.isTie ? (
        <div className="vpr-tie-box">
          <Award size={18} />
          <div>
            <strong>Result tied</strong>
            <span>
              {postResult.tiedCandidates?.length || 0} candidates have equal
              highest votes.
            </span>
          </div>
        </div>
      ) : (
        <div className="vpr-tie-box">
          <Award size={18} />
          <div>
            <strong>No winner declared</strong>
            <span>No votes were cast for this post.</span>
          </div>
        </div>
      )}

      <div className="vpr-candidate-result-list">
        {candidates.length ? (
          candidates.map((candidate, index) => {
            const percent = getPercent(
              candidate.totalVotes,
              postResult?.totalVotesCastForPost,
            );

            return (
              <div key={candidate._id} className="vpr-candidate-result-row">
                <div className="vpr-rank">{index + 1}</div>

                <div className="vpr-candidate-avatar">
                  {candidate?.candidatePhotoUrl ? (
                    <img
                      src={candidate.candidatePhotoUrl}
                      alt={candidate.fullName || "Candidate"}
                    />
                  ) : (
                    <UsersRound size={18} />
                  )}
                </div>

                <div className="vpr-candidate-main">
                  <div className="vpr-candidate-title">
                    <strong>{candidate.fullName || "Candidate"}</strong>
                    <span>{candidate.partyName || "Independent"}</span>
                  </div>

                  <div className="vpr-progress">
                    <span style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="vpr-vote-count">
                  <strong>{candidate.totalVotes || 0}</strong>
                  <span>{percent}%</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="vcp-empty">
            No approved candidates were available for this post.
          </div>
        )}
      </div>
    </article>
  );
}
