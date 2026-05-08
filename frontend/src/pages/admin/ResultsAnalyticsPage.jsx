import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  CalendarClock,
  Crown,
  FileBarChart2,
  LayoutGrid,
  ListChecks,
  PieChart as PieChartIcon,
  RefreshCw,
  ShieldCheck,
  Trophy,
  UsersRound,
  Vote,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { electionService } from "../../services/election.service";
import { resultService } from "../../services/result.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";
import "../../styles/admin-light-theme.css";

const CHART_COLORS = [
  "#247a52",
  "#6750a4",
  "#f59e0b",
  "#ba3545",
  "#2f9d68",
  "#8b6fc8",
  "#a46315",
];

const tabs = [
  { id: "summary", label: "Summary", icon: LayoutGrid },
  { id: "charts", label: "Charts", icon: BarChart3 },
  { id: "winners", label: "Winners", icon: Trophy },
  { id: "posts", label: "Post Details", icon: ListChecks },
];

const safeNumber = (value) => Number(value || 0);

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(safeNumber(value));
}

function formatDateTime(value) {
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

function formatStatus(value = "unknown") {
  return String(value || "unknown")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function getPercent(value, total) {
  if (!total) return 0;
  return Math.round((safeNumber(value) / safeNumber(total)) * 100);
}

function getElectionStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "active") return "arp-status arp-status--active";
  if (value === "ended") return "arp-status arp-status--ended";
  if (value === "upcoming") return "arp-status arp-status--upcoming";

  return "arp-status";
}

function MetricCard({ icon: Icon, label, value, helper, tone = "green" }) {
  return (
    <article className={`arp-metric-card arp-metric-card--${tone}`}>
      <div className="arp-metric-card__icon">
        <Icon size={20} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {helper ? <p>{helper}</p> : null}
      </div>
    </article>
  );
}

function ChartCard({ title, label, icon: Icon, children }) {
  return (
    <article className="arp-chart-card">
      <div className="arp-panel-header">
        <div>
          <h3>{title}</h3>
          <span>{label}</span>
        </div>

        <div className="arp-panel-icon">
          <Icon size={18} />
        </div>
      </div>

      <div className="arp-chart-card__body">{children}</div>
    </article>
  );
}

function EmptyBox({ children = "No data available." }) {
  return <div className="arp-empty-box">{children}</div>;
}

function CandidateRow({ candidate, index, totalVotes }) {
  const percent = getPercent(candidate?.totalVotes, totalVotes);

  return (
    <article className="arp-candidate-row">
      <div className="arp-rank">{index + 1}</div>

      <div className="arp-candidate-avatar">
        {candidate?.candidatePhotoUrl ? (
          <img
            src={candidate.candidatePhotoUrl}
            alt={candidate?.fullName || "Candidate"}
          />
        ) : (
          <UsersRound size={18} />
        )}
      </div>

      <div className="arp-candidate-main">
        <div className="arp-candidate-title">
          <strong>{candidate?.fullName || "Candidate"}</strong>
          <span>{candidate?.partyName || "Independent"}</span>
        </div>

        <div className="arp-progress">
          <div style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="arp-vote-count">
        <strong>{formatNumber(candidate?.totalVotes)}</strong>
        <span>{percent}%</span>
      </div>
    </article>
  );
}

function PostResultCard({ postResult }) {
  const candidates = Array.isArray(postResult?.candidates)
    ? postResult.candidates
    : [];

  const totalVotes = safeNumber(postResult?.totalVotesCastForPost);

  return (
    <article className="arp-post-card">
      <div className="arp-post-card__header">
        <div>
          <h4>{postResult?.post?.title || "Post"}</h4>
          <p>
            {postResult?.post?.description ||
              "No post description is available."}
          </p>
        </div>

        <span>{formatNumber(totalVotes)} votes</span>
      </div>

      {postResult?.winner ? (
        <div className="arp-winner-box">
          <Crown size={18} />
          <div>
            <strong>{postResult.winner.fullName}</strong>
            <span>
              Winner • {postResult.winner.partyName || "Independent"} •{" "}
              {formatNumber(postResult.winner.totalVotes)} votes
            </span>
          </div>
        </div>
      ) : postResult?.isTie ? (
        <div className="arp-tie-box">
          <Award size={18} />
          <div>
            <strong>Result tied</strong>
            <span>
              {postResult?.tiedCandidates?.length || 0} candidates have the same
              highest vote count.
            </span>
          </div>
        </div>
      ) : (
        <div className="arp-tie-box">
          <Award size={18} />
          <div>
            <strong>No winner declared</strong>
            <span>No valid votes were cast for this post.</span>
          </div>
        </div>
      )}

      <div className="arp-candidate-list">
        {candidates.length ? (
          candidates.map((candidate, index) => (
            <CandidateRow
              key={candidate?._id || `${candidate?.fullName}-${index}`}
              candidate={candidate}
              index={index}
              totalVotes={totalVotes}
            />
          ))
        ) : (
          <EmptyBox>No approved candidates found for this post.</EmptyBox>
        )}
      </div>
    </article>
  );
}

export default function ResultsAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("summary");
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [loadingElections, setLoadingElections] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultData, setResultData] = useState(null);

  const selectedElection = useMemo(() => {
    return (
      elections.find((election) => election?._id === selectedElectionId) || null
    );
  }, [elections, selectedElectionId]);

  const posts = useMemo(() => {
    return Array.isArray(resultData?.results) ? resultData.results : [];
  }, [resultData]);

  const totalVotes = safeNumber(resultData?.totalVotesCast);
  const totalPosts = safeNumber(resultData?.totalPosts);

  const winners = useMemo(() => {
    return posts
      .filter((postResult) => postResult?.winner)
      .map((postResult) => ({
        post: postResult.post,
        winner: postResult.winner,
        totalVotesCastForPost: postResult.totalVotesCastForPost,
      }));
  }, [posts]);

  const tiedPosts = useMemo(() => {
    return posts.filter((postResult) => postResult?.isTie);
  }, [posts]);

  const leadingCandidates = useMemo(() => {
    return posts
      .flatMap((item) =>
        Array.isArray(item?.candidates)
          ? item.candidates.map((candidate) => ({
              postTitle: item?.post?.title || "Post",
              fullName: candidate?.fullName || "Candidate",
              partyName: candidate?.partyName || "Independent",
              candidatePhotoUrl: candidate?.candidatePhotoUrl || "",
              votes: safeNumber(candidate?.totalVotes),
            }))
          : [],
      )
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 8);
  }, [posts]);

  const votesByPostChart = useMemo(() => {
    return posts.map((item) => ({
      name: item?.post?.title || "Post",
      votes: safeNumber(item?.totalVotesCastForPost),
    }));
  }, [posts]);

  const winnerChart = useMemo(() => {
    return winners.map((item) => ({
      name: item?.post?.title || "Post",
      votes: safeNumber(item?.winner?.totalVotes),
    }));
  }, [winners]);

  const candidateComparisonChart = useMemo(() => {
    return leadingCandidates.map((candidate) => ({
      name:
        candidate.fullName.length > 14
          ? `${candidate.fullName.slice(0, 14)}...`
          : candidate.fullName,
      votes: candidate.votes,
    }));
  }, [leadingCandidates]);

  const postHealthChart = useMemo(() => {
    return posts.map((item) => ({
      name: item?.post?.title || "Post",
      candidates: Array.isArray(item?.candidates) ? item.candidates.length : 0,
      votes: safeNumber(item?.totalVotesCastForPost),
    }));
  }, [posts]);

  const loadElections = async () => {
    try {
      setLoadingElections(true);

      const data = await electionService.getAll({
        page: 1,
        limit: 100,
      });

      const items = Array.isArray(data?.items) ? data.items : [];

      setElections(items);

      if (!selectedElectionId && items.length > 0) {
        const endedElection = items.find(
          (election) => election.status === "ended",
        );
        setSelectedElectionId((endedElection || items[0])._id);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setElections([]);
      setSelectedElectionId("");
    } finally {
      setLoadingElections(false);
    }
  };

  const loadResults = async (electionId) => {
    if (!electionId) {
      setResultData(null);
      return;
    }

    try {
      setLoadingResults(true);

      const data = await resultService.getElectionResults(electionId);
      setResultData(data || null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setResultData(null);
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    loadElections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      loadResults(selectedElectionId);
    }
  }, [selectedElectionId]);

  const handleRefresh = async () => {
    await loadResults(selectedElectionId);
    toast.success("Results refreshed.");
  };

  return (
    <section className="admin-crud arp-page">
      <section className="arp-hero">
        <div>
          <span className="adm-eyebrow">
            <BarChart3 size={15} />
            Results analytics
          </span>

          <h2>Review election outcomes without visual clutter.</h2>

          <div className="arp-hero-actions">
            <button
              type="button"
              className="adm-primary-btn"
              onClick={() => setActiveTab("charts")}
            >
              <BarChart3 size={16} />
              Open Charts
            </button>

            <button
              type="button"
              className="adm-secondary-btn"
              onClick={handleRefresh}
              disabled={!selectedElectionId || loadingResults}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        <div className="arp-hero-mini-grid">
          <div>
            <span>Total votes</span>
            <strong>{loadingResults ? "..." : formatNumber(totalVotes)}</strong>
          </div>

          <div>
            <span>Posts</span>
            <strong>{loadingResults ? "..." : formatNumber(totalPosts)}</strong>
          </div>

          <div>
            <span>Winners</span>
            <strong>
              {loadingResults ? "..." : formatNumber(winners.length)}
            </strong>
          </div>
        </div>
      </section>

      <section className="arp-context-card">
        <label>
          <span>Election</span>
          <select
            value={selectedElectionId}
            onChange={(event) => setSelectedElectionId(event.target.value)}
            disabled={loadingElections}
          >
            {elections.length === 0 ? (
              <option value="">No elections available</option>
            ) : (
              elections.map((election) => (
                <option key={election._id} value={election._id}>
                  {election.title}
                </option>
              ))
            )}
          </select>
        </label>

        <div className="arp-context-summary">
          <span
            className={getElectionStatusClass(resultData?.election?.status)}
          >
            {formatStatus(
              resultData?.election?.status || selectedElection?.status,
            )}
          </span>

          <span>
            {resultData?.isFinalResult ? "Final result" : "Provisional result"}
          </span>

          <span>
            Ends:{" "}
            {formatDateTime(
              resultData?.election?.endDate || selectedElection?.endDate,
            )}
          </span>
        </div>
      </section>

      <div className="adm-tabs" role="tablist" aria-label="Result sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loadingResults ? (
        <div className="arp-empty-box arp-empty-box--large">
          Loading election results...
        </div>
      ) : !selectedElectionId || !resultData ? (
        <div className="arp-empty-box arp-empty-box--large">
          No result data is available for the selected election.
        </div>
      ) : (
        <>
          {activeTab === "summary" && (
            <div className="arp-tab-panel">
              <div className="arp-metric-grid">
                <MetricCard
                  icon={Vote}
                  label="Total Votes"
                  value={formatNumber(totalVotes)}
                  helper="All posts combined"
                  tone="green"
                />

                <MetricCard
                  icon={FileBarChart2}
                  label="Posts"
                  value={formatNumber(totalPosts)}
                  helper="Included in result"
                  tone="purple"
                />

                <MetricCard
                  icon={Crown}
                  label="Winners"
                  value={formatNumber(winners.length)}
                  helper="Clear winning posts"
                  tone="amber"
                />

                <MetricCard
                  icon={Award}
                  label="Ties"
                  value={formatNumber(tiedPosts.length)}
                  helper="Needs manual review"
                  tone="rose"
                />
              </div>

              <section className="arp-panel-card">
                <div className="arp-panel-header">
                  <div>
                    <h3>Post summary</h3>
                    <span>Compact vote overview by post</span>
                  </div>

                  <span className="arp-panel-badge">
                    {resultData?.isFinalResult ? "Final" : "Provisional"}
                  </span>
                </div>

                {posts.length ? (
                  <div className="arp-summary-list">
                    {posts.map((postResult, index) => {
                      const percent = getPercent(
                        postResult?.totalVotesCastForPost,
                        totalVotes,
                      );

                      return (
                        <article
                          key={postResult?.post?._id || `${index}`}
                          className="arp-summary-row"
                        >
                          <div className="arp-summary-row__icon">
                            <Vote size={16} />
                          </div>

                          <div className="arp-summary-row__main">
                            <div className="arp-summary-row__top">
                              <h4>{postResult?.post?.title || "Post"}</h4>
                              <span>
                                {formatNumber(
                                  postResult?.totalVotesCastForPost,
                                )}{" "}
                                votes
                              </span>
                            </div>

                            <div className="arp-progress">
                              <div style={{ width: `${percent}%` }} />
                            </div>
                          </div>

                          <span className="arp-id-chip">{percent}%</span>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyBox>No post summary available.</EmptyBox>
                )}
              </section>
            </div>
          )}

          {activeTab === "charts" && (
            <div className="arp-tab-panel">
              <div className="arp-chart-grid">
                <ChartCard
                  title="Votes by post"
                  label="Bar chart distribution"
                  icon={BarChart3}
                >
                  {votesByPostChart.length ? (
                    <div className="arp-chart-box arp-chart-box--large">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={votesByPostChart}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#eadfce"
                          />
                          <XAxis dataKey="name" stroke="#6b7280" hide />
                          <YAxis stroke="#6b7280" />
                          <Tooltip />
                          <Bar
                            dataKey="votes"
                            fill="#247a52"
                            radius={[10, 10, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyBox>No chart data available.</EmptyBox>
                  )}
                </ChartCard>

                <ChartCard
                  title="Vote share by post"
                  label="Pie distribution"
                  icon={PieChartIcon}
                >
                  {votesByPostChart.length ? (
                    <>
                      <div className="arp-chart-box arp-chart-box--medium">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={votesByPostChart}
                              dataKey="votes"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={95}
                              innerRadius={56}
                            >
                              {votesByPostChart.map((entry, index) => (
                                <Cell
                                  key={`${entry.name}-${index}`}
                                  fill={
                                    CHART_COLORS[index % CHART_COLORS.length]
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="arp-chart-legend">
                        {votesByPostChart.map((entry, index) => (
                          <div key={entry.name}>
                            <span
                              style={{
                                background:
                                  CHART_COLORS[index % CHART_COLORS.length],
                              }}
                            />
                            <strong>{entry.name}</strong>
                            <em>{formatNumber(entry.votes)}</em>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <EmptyBox>No vote-share data available.</EmptyBox>
                  )}
                </ChartCard>

                <ChartCard
                  title="Leading candidates"
                  label="Top candidate comparison"
                  icon={Trophy}
                >
                  {candidateComparisonChart.length ? (
                    <div className="arp-chart-box arp-chart-box--large">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={candidateComparisonChart}>
                          <defs>
                            <linearGradient
                              id="arpCandidateArea"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#6750a4"
                                stopOpacity={0.35}
                              />
                              <stop
                                offset="95%"
                                stopColor="#6750a4"
                                stopOpacity={0.04}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#eadfce"
                          />
                          <XAxis dataKey="name" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="votes"
                            stroke="#6750a4"
                            fill="url(#arpCandidateArea)"
                            strokeWidth={3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyBox>No candidate comparison data available.</EmptyBox>
                  )}
                </ChartCard>

                <ChartCard
                  title="Post health"
                  label="Votes and approved candidate count"
                  icon={ShieldCheck}
                >
                  {postHealthChart.length ? (
                    <div className="arp-chart-box arp-chart-box--large">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={postHealthChart}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#eadfce"
                          />
                          <XAxis dataKey="name" stroke="#6b7280" hide />
                          <YAxis stroke="#6b7280" />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="votes"
                            stroke="#247a52"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="candidates"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyBox>No post health data available.</EmptyBox>
                  )}
                </ChartCard>
              </div>
            </div>
          )}

          {activeTab === "winners" && (
            <div className="arp-tab-panel">
              <section className="arp-panel-card">
                <div className="arp-panel-header">
                  <div>
                    <h3>Winner board</h3>
                    <span>Post-wise winning candidates</span>
                  </div>

                  <span className="arp-panel-badge">
                    {winners.length} winner(s)
                  </span>
                </div>

                {winners.length ? (
                  <div className="arp-winner-grid">
                    {winners.map((item, index) => (
                      <article
                        key={item?.post?._id || `${item?.winner?._id}-${index}`}
                        className="arp-winner-card"
                      >
                        <div className="arp-winner-card__top">
                          <div className="arp-candidate-avatar">
                            {item?.winner?.candidatePhotoUrl ? (
                              <img
                                src={item.winner.candidatePhotoUrl}
                                alt={item.winner.fullName || "Winner"}
                              />
                            ) : (
                              <Crown size={18} />
                            )}
                          </div>

                          <div>
                            <h4>{item?.winner?.fullName || "Winner"}</h4>
                            <p>{item?.winner?.partyName || "Independent"}</p>
                          </div>

                          <span>
                            <Crown size={13} />
                            Winner
                          </span>
                        </div>

                        <div className="arp-winner-card__meta">
                          <div>
                            <span>Post</span>
                            <strong>{item?.post?.title || "Post"}</strong>
                          </div>

                          <div>
                            <span>Votes</span>
                            <strong>
                              {formatNumber(item?.winner?.totalVotes)}
                            </strong>
                          </div>

                          <div>
                            <span>Post total</span>
                            <strong>
                              {formatNumber(item?.totalVotesCastForPost)}
                            </strong>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyBox>No clear winners declared yet.</EmptyBox>
                )}
              </section>

              <section className="arp-panel-card">
                <div className="arp-panel-header">
                  <div>
                    <h3>Leading candidate ranking</h3>
                    <span>Top candidates across selected election</span>
                  </div>
                </div>

                {leadingCandidates.length ? (
                  <div className="arp-leading-list">
                    {leadingCandidates.map((candidate, index) => (
                      <article
                        key={`${candidate.postTitle}-${candidate.fullName}-${index}`}
                        className="arp-leading-row"
                      >
                        <div className="arp-rank">{index + 1}</div>

                        <div>
                          <h4>{candidate.fullName}</h4>
                          <p>
                            {candidate.partyName} • {candidate.postTitle}
                          </p>
                        </div>

                        <strong>{formatNumber(candidate.votes)} votes</strong>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyBox>No candidate ranking data available.</EmptyBox>
                )}
              </section>
            </div>
          )}

          {activeTab === "posts" && (
            <div className="arp-tab-panel">
              <div className="arp-post-stack">
                {posts.length ? (
                  posts.map((postResult) => (
                    <PostResultCard
                      key={postResult?.post?._id}
                      postResult={postResult}
                    />
                  ))
                ) : (
                  <EmptyBox>No post result data available.</EmptyBox>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
