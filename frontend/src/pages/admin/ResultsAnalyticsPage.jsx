import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Trophy,
  Vote,
  Layers3,
  RefreshCw,
  AlertTriangle,
  Crown,
  Medal,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { electionService } from "../../services/election.service";
import { resultService } from "../../services/result.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/results-analytics.css";

const RESULT_COLORS = [
  "#6d72ff",
  "#15c7e5",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#84cc16",
];

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatCard({ title, value, subtitle, icon: Icon, tone = "primary" }) {
  return (
    <article className={`results-stat-card results-stat-card--${tone}`}>
      <div className="results-stat-card__top">
        <div>
          <p className="results-stat-card__label">{title}</p>
          <h3 className="results-stat-card__value">{value}</h3>
        </div>

        <div className="results-stat-card__icon">
          <Icon size={18} />
        </div>
      </div>

      <p className="results-stat-card__subtitle">{subtitle}</p>
    </article>
  );
}

function Panel({ title, description, children, action = null }) {
  return (
    <section className="results-panel">
      <div className="results-panel__header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>

        {action ? <div className="results-panel__action">{action}</div> : null}
      </div>

      <div className="results-panel__body">{children}</div>
    </section>
  );
}

function EmptyState({ text }) {
  return (
    <div className="results-empty-state">
      <p>{text}</p>
    </div>
  );
}

export default function ResultsAnalyticsPage() {
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");

  const [electionsLoading, setElectionsLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [electionResults, setElectionResults] = useState(null);
  const [postResults, setPostResults] = useState(null);

  const loadElections = async () => {
    try {
      setElectionsLoading(true);

      const data = await electionService.getAll({
        page: 1,
        limit: 100,
      });

      const items = Array.isArray(data?.items) ? data.items : [];

      setElections(items);

      if (items.length > 0) {
        setSelectedElectionId((prev) => prev || items[0]._id);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setElectionsLoading(false);
    }
  };

  const loadElectionResults = async (electionId, { silent = false } = {}) => {
    if (!electionId) return;

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setResultsLoading(true);
      }

      const data = await resultService.getElectionResults(electionId);
      setElectionResults(data);

      const firstPostId = data?.results?.[0]?.post?._id || "";
      setSelectedPostId((prev) => {
        const stillExists = (data?.results || []).some(
          (item) => item?.post?._id === prev,
        );
        return stillExists ? prev : firstPostId;
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setElectionResults(null);
      setSelectedPostId("");
    } finally {
      setResultsLoading(false);
      setRefreshing(false);
    }
  };

  const loadPostResults = async (electionId, postId) => {
    if (!electionId || !postId) {
      setPostResults(null);
      return;
    }

    try {
      const data = await resultService.getPostResults(electionId, postId);
      setPostResults(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setPostResults(null);
    }
  };

  useEffect(() => {
    loadElections();
  }, []);

  useEffect(() => {
    if (!selectedElectionId) return;
    loadElectionResults(selectedElectionId);
  }, [selectedElectionId]);

  useEffect(() => {
    if (!selectedElectionId || !selectedPostId) {
      setPostResults(null);
      return;
    }

    loadPostResults(selectedElectionId, selectedPostId);
  }, [selectedElectionId, selectedPostId]);

  const selectedElection = useMemo(() => {
    return elections.find((item) => item._id === selectedElectionId) || null;
  }, [elections, selectedElectionId]);

  const resultItems = Array.isArray(electionResults?.results)
    ? electionResults.results
    : [];

  const selectedPostResult = useMemo(() => {
    if (postResults) return postResults;
    return (
      resultItems.find((item) => item?.post?._id === selectedPostId) || null
    );
  }, [postResults, resultItems, selectedPostId]);

  const postOptions = useMemo(() => {
    return resultItems.map((item) => ({
      value: item?.post?._id || "",
      label: item?.post?.title || "Untitled Post",
    }));
  }, [resultItems]);

  const candidateBarData = useMemo(() => {
    const candidates = Array.isArray(selectedPostResult?.candidates)
      ? selectedPostResult.candidates
      : [];

    return candidates.map((candidate) => ({
      name: candidate?.fullName || "Unknown",
      votes: Number(candidate?.totalVotes || 0),
      partyName: candidate?.partyName || "Independent",
    }));
  }, [selectedPostResult]);

  const postVoteShareData = useMemo(() => {
    return resultItems.map((item) => ({
      name: item?.post?.title || "Untitled",
      votes: Number(item?.totalVotesCastForPost || 0),
    }));
  }, [resultItems]);

  const totalCandidatesInSelectedPost = Array.isArray(
    selectedPostResult?.candidates,
  )
    ? selectedPostResult.candidates.length
    : 0;

  const leadingCandidate = selectedPostResult?.winner || null;
  const isTie = Boolean(selectedPostResult?.isTie);

  const tiedCandidateNames = Array.isArray(selectedPostResult?.tiedCandidates)
    ? selectedPostResult.tiedCandidates
        .map((item) => item?.fullName)
        .filter(Boolean)
    : [];

  return (
    <section className="results-page">
      <div className="results-hero">
        <div className="results-hero__content">
          <span className="results-hero__badge">
            <Trophy size={15} />
            Serious analytics, not fake dashboard decoration
          </span>

          <h2>
            Election results should be readable in seconds, not hunted down.
          </h2>

          <p>
            This screen gives admin a real operational view: which election is
            selected, which post is winning, where ties exist, and how vote
            share is distributed across candidates.
          </p>
        </div>

        <div className="results-hero__controls">
          <div className="results-field">
            <label htmlFor="election-select">Select Election</label>
            <select
              id="election-select"
              value={selectedElectionId}
              onChange={(event) => setSelectedElectionId(event.target.value)}
              disabled={electionsLoading || elections.length === 0}
            >
              {elections.length === 0 ? (
                <option value="">No elections found</option>
              ) : (
                elections.map((election) => (
                  <option key={election._id} value={election._id}>
                    {election.title}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="results-field">
            <label htmlFor="post-select">Select Post</label>
            <select
              id="post-select"
              value={selectedPostId}
              onChange={(event) => setSelectedPostId(event.target.value)}
              disabled={!selectedElectionId || postOptions.length === 0}
            >
              {postOptions.length === 0 ? (
                <option value="">No posts found</option>
              ) : (
                postOptions.map((post) => (
                  <option key={post.value} value={post.value}>
                    {post.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            className="results-refresh-btn"
            onClick={() =>
              loadElectionResults(selectedElectionId, { silent: true })
            }
            disabled={!selectedElectionId || refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "spin-animation" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh results"}
          </button>
        </div>
      </div>

      {resultsLoading ? (
        <div className="results-loading-grid">
          <div className="results-skeleton results-skeleton--hero" />
          <div className="results-skeleton results-skeleton--card" />
          <div className="results-skeleton results-skeleton--card" />
          <div className="results-skeleton results-skeleton--card" />
          <div className="results-skeleton results-skeleton--panel" />
          <div className="results-skeleton results-skeleton--panel" />
        </div>
      ) : !electionResults ? (
        <EmptyState text="Election results could not be loaded." />
      ) : (
        <>
          <div className="results-election-strip">
            <div className="results-election-strip__item">
              <span>Status</span>
              <strong
                className={`results-status-pill results-status-pill--${String(electionResults?.election?.status || "upcoming").toLowerCase()}`}
              >
                {String(electionResults?.election?.status || "upcoming")}
              </strong>
            </div>

            <div className="results-election-strip__item">
              <span>Published</span>
              <strong>
                {electionResults?.election?.isPublished ? "Yes" : "No"}
              </strong>
            </div>

            <div className="results-election-strip__item">
              <span>Start</span>
              <strong>
                {formatDate(electionResults?.election?.startDate)}
              </strong>
            </div>

            <div className="results-election-strip__item">
              <span>End</span>
              <strong>{formatDate(electionResults?.election?.endDate)}</strong>
            </div>
          </div>

          <div className="results-stats-grid">
            <StatCard
              title="Total Posts"
              value={formatNumber(electionResults?.totalPosts || 0)}
              subtitle="How many positions are part of this election"
              icon={Layers3}
              tone="primary"
            />

            <StatCard
              title="Total Votes Cast"
              value={formatNumber(electionResults?.totalVotesCast || 0)}
              subtitle="All recorded votes across all posts in the selected election"
              icon={Vote}
              tone="cyan"
            />

            <StatCard
              title="Selected Post Candidates"
              value={formatNumber(totalCandidatesInSelectedPost)}
              subtitle="Approved candidates currently included in the selected post result"
              icon={Activity}
              tone="green"
            />

            <StatCard
              title="Result Mode"
              value={electionResults?.isFinalResult ? "Final" : "Provisional"}
              subtitle="Ended election means final result, otherwise still provisional"
              icon={CheckCircle2}
              tone="amber"
            />
          </div>

          <div className="results-main-grid">
            <Panel
              title="Post-wise Vote Load"
              description="This chart quickly exposes which post is attracting the highest vote volume."
            >
              {postVoteShareData.length > 0 ? (
                <div className="results-chart results-chart--md">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={postVoteShareData} barCategoryGap={24}>
                      <CartesianGrid
                        stroke="rgba(255,255,255,0.08)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#9db0c8"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="#9db0c8"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(8, 15, 30, 0.96)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 14,
                        }}
                      />
                      <Bar dataKey="votes" radius={[12, 12, 0, 0]}>
                        {postVoteShareData.map((item, index) => (
                          <Cell
                            key={`${item.name}-${index}`}
                            fill={RESULT_COLORS[index % RESULT_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState text="No post vote data available." />
              )}
            </Panel>

            <Panel
              title="Selected Post Vote Distribution"
              description="Candidate-wise vote split for the currently selected post."
            >
              {candidateBarData.length > 0 ? (
                <div className="results-chart results-chart--md">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={candidateBarData}
                        dataKey="votes"
                        nameKey="name"
                        innerRadius={72}
                        outerRadius={110}
                        paddingAngle={4}
                      >
                        {candidateBarData.map((item, index) => (
                          <Cell
                            key={`${item.name}-${index}`}
                            fill={RESULT_COLORS[index % RESULT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(8, 15, 30, 0.96)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 14,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState text="No candidate distribution data available." />
              )}

              {candidateBarData.length > 0 && (
                <div className="results-legend-list">
                  {candidateBarData.map((item, index) => (
                    <div key={item.name} className="results-legend-item">
                      <span
                        className="results-legend-item__dot"
                        style={{
                          background:
                            RESULT_COLORS[index % RESULT_COLORS.length],
                        }}
                      />
                      <span className="results-legend-item__name">
                        {item.name}
                      </span>
                      <strong className="results-legend-item__value">
                        {formatNumber(item.votes)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              title="Selected Post Ranking"
              description="This is the clean ranked view that admin actually needs during monitoring."
              action={
                selectedPostResult?.post?.title ? (
                  <span className="results-panel__pill">
                    {selectedPostResult.post.title}
                  </span>
                ) : null
              }
            >
              {candidateBarData.length > 0 ? (
                <div className="results-chart results-chart--lg">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={candidateBarData}
                      layout="vertical"
                      margin={{ left: 20, right: 20 }}
                    >
                      <CartesianGrid
                        stroke="rgba(255,255,255,0.08)"
                        horizontal
                        vertical={false}
                      />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        stroke="#9db0c8"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        stroke="#9db0c8"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(8, 15, 30, 0.96)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 14,
                        }}
                      />
                      <Bar dataKey="votes" radius={[0, 12, 12, 0]}>
                        {candidateBarData.map((item, index) => (
                          <Cell
                            key={`${item.name}-${index}`}
                            fill={RESULT_COLORS[index % RESULT_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState text="No candidate ranking data available." />
              )}
            </Panel>

            <Panel
              title="Winner / Tie Summary"
              description="Don’t bury the lead. Admin should instantly know the current leader or tie state."
            >
              {selectedPostResult ? (
                <div className="results-summary-stack">
                  <div className="results-summary-card">
                    <div className="results-summary-card__icon">
                      {isTie ? (
                        <AlertTriangle size={20} />
                      ) : (
                        <Crown size={20} />
                      )}
                    </div>

                    <div className="results-summary-card__content">
                      <span className="results-summary-card__label">
                        {isTie ? "Tie detected" : "Current winner"}
                      </span>

                      <h4>
                        {isTie
                          ? tiedCandidateNames.join(", ") || "Tie"
                          : leadingCandidate?.fullName || "No winner yet"}
                      </h4>

                      <p>
                        {isTie
                          ? "Multiple candidates currently share the highest vote count. This needs attention in the UI and reporting."
                          : leadingCandidate
                            ? `${leadingCandidate.fullName} is leading this post with ${formatNumber(leadingCandidate.totalVotes)} votes.`
                            : "No candidate has secured votes yet for this post."}
                      </p>
                    </div>
                  </div>

                  <div className="results-summary-metrics">
                    <div className="results-summary-metric">
                      <span>Total post votes</span>
                      <strong>
                        {formatNumber(
                          selectedPostResult?.totalVotesCastForPost || 0,
                        )}
                      </strong>
                    </div>

                    <div className="results-summary-metric">
                      <span>Post status</span>
                      <strong>
                        {selectedPostResult?.isFinalResult ? "Final" : "Live"}
                      </strong>
                    </div>

                    <div className="results-summary-metric">
                      <span>Max votes / voter</span>
                      <strong>
                        {formatNumber(
                          selectedPostResult?.post?.maxVotesPerVoter || 0,
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState text="No summary data available for the selected post." />
              )}
            </Panel>

            <Panel
              title="Post Cards"
              description="Compact cards for all posts in the selected election. Good for scanning without changing the dropdown every second."
            >
              {resultItems.length > 0 ? (
                <div className="results-post-cards">
                  {resultItems.map((item) => {
                    const winner = item?.winner || null;
                    const itemIsTie = Boolean(item?.isTie);
                    const isActiveCard = item?.post?._id === selectedPostId;

                    return (
                      <button
                        key={item?.post?._id}
                        type="button"
                        className={`results-post-card ${isActiveCard ? "results-post-card--active" : ""}`}
                        onClick={() => setSelectedPostId(item?.post?._id || "")}
                      >
                        <div className="results-post-card__top">
                          <h4>{item?.post?.title || "Untitled Post"}</h4>
                          <span className="results-post-card__votes">
                            {formatNumber(item?.totalVotesCastForPost || 0)}{" "}
                            votes
                          </span>
                        </div>

                        <p className="results-post-card__desc">
                          {item?.post?.description ||
                            "No description available."}
                        </p>

                        <div className="results-post-card__bottom">
                          <span className="results-post-card__tag">
                            {itemIsTie
                              ? "Tie"
                              : winner
                                ? `Winner: ${winner.fullName}`
                                : "No winner yet"}
                          </span>

                          <span className="results-post-card__tag results-post-card__tag--soft">
                            {Array.isArray(item?.candidates)
                              ? item.candidates.length
                              : 0}{" "}
                            candidates
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState text="No post cards available for this election." />
              )}
            </Panel>

            <Panel
              title="Election Header Snapshot"
              description="Basic election metadata should still be visible without forcing the user back to the elections module."
            >
              {selectedElection ? (
                <div className="results-election-card">
                  <div className="results-election-card__title-row">
                    <div>
                      <span className="results-election-card__eyebrow">
                        Selected Election
                      </span>
                      <h4>{selectedElection.title}</h4>
                    </div>

                    <div className="results-election-card__badge-row">
                      <span
                        className={`results-status-pill results-status-pill--${String(selectedElection?.status || "upcoming").toLowerCase()}`}
                      >
                        {String(selectedElection?.status || "upcoming")}
                      </span>
                      <span className="results-light-badge">
                        {selectedElection?.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>

                  <p className="results-election-card__description">
                    {selectedElection?.description ||
                      "No election description available."}
                  </p>

                  <div className="results-election-card__meta-grid">
                    <div>
                      <span>Allowed voter type</span>
                      <strong>
                        {selectedElection?.allowedVoterType || "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span>Start date</span>
                      <strong>{formatDate(selectedElection?.startDate)}</strong>
                    </div>

                    <div>
                      <span>End date</span>
                      <strong>{formatDate(selectedElection?.endDate)}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState text="No election selected." />
              )}
            </Panel>
          </div>
        </>
      )}
    </section>
  );
}
