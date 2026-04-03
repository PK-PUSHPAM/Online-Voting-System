import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  PieChart as PieChartIcon,
  Trophy,
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
} from "recharts";
import { electionService } from "../../services/election.service";
import { resultService as resultsService } from "../../services/result.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";
import "../../styles/dashboard.css";

const CHART_COLORS = [
  "#6d72ff",
  "#13c8e6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
];

const safeNumber = (value) => Number(value || 0);

export default function ResultsAnalyticsPage() {
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [loadingElections, setLoadingElections] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultData, setResultData] = useState(null);

  const selectedElection = useMemo(
    () => elections.find((item) => item._id === selectedElectionId) || null,
    [elections, selectedElectionId],
  );

  const posts = useMemo(() => {
    return Array.isArray(resultData?.results) ? resultData.results : [];
  }, [resultData]);

  const totalVotes = useMemo(() => {
    return safeNumber(resultData?.totalVotesCast);
  }, [resultData]);

  const leadingCandidates = useMemo(() => {
    return posts
      .flatMap((item) =>
        Array.isArray(item?.candidates)
          ? item.candidates.map((candidate) => ({
              postTitle: item?.post?.title || "Post",
              fullName: candidate?.fullName || "Candidate",
              votes: safeNumber(candidate?.totalVotes),
            }))
          : [],
      )
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 6);
  }, [posts]);

  const chartData = useMemo(() => {
    return posts.map((item) => ({
      name: item?.post?.title || "Post",
      votes: safeNumber(item?.totalVotesCastForPost),
    }));
  }, [posts]);

  const loadElections = async () => {
    try {
      setLoadingElections(true);
      const data = await electionService.getAll({ page: 1, limit: 100 });
      const items = Array.isArray(data?.items) ? data.items : [];
      setElections(items);

      if (!selectedElectionId && items.length > 0) {
        setSelectedElectionId(items[0]._id);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setElections([]);
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
      const data = await resultsService.getElectionResults(electionId);
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
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      loadResults(selectedElectionId);
    }
  }, [selectedElectionId]);

  return (
    <section className="admin-crud">
      <div className="admin-crud__hero">
        <div className="admin-crud__hero-copy">
          <span className="admin-crud__eyebrow">
            <BarChart3 size={14} />
            Results analytics
          </span>

          <h2>
            Review election outcomes, compare post-level vote totals, and
            identify leading candidates.
          </h2>

          <p>
            This view summarizes the selected election by post, vote volume, and
            candidate ranking so outcomes can be reviewed clearly.
          </p>
        </div>

        <div className="admin-crud__hero-grid">
          <div className="admin-crud__hero-stat">
            <span>Selected election</span>
            <strong>
              {selectedElection ? selectedElection.title.slice(0, 18) : "None"}
            </strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Posts included</span>
            <strong>{safeNumber(resultData?.totalPosts)}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Total votes counted</span>
            <strong>{totalVotes}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Leading candidates shown</span>
            <strong>{leadingCandidates.length}</strong>
          </div>
        </div>
      </div>

      <div className="admin-crud__panel">
        <div className="admin-crud__toolbar">
          <div className="admin-crud__toolbar-left">
            <h3 style={{ margin: 0 }}>Election results</h3>
            <span className="admin-crud__meta">
              Post-level distribution and candidate ranking
            </span>
          </div>

          <div className="admin-crud__toolbar-right">
            <select
              className="admin-crud__select"
              value={selectedElectionId}
              onChange={(event) => setSelectedElectionId(event.target.value)}
              disabled={loadingElections}
              style={{ minWidth: 280 }}
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
          </div>
        </div>

        {loadingResults ? (
          <div className="admin-crud__empty">
            <p>Loading election results...</p>
          </div>
        ) : !selectedElectionId || !resultData ? (
          <div className="admin-crud__empty">
            <p>No result data is available for the selected election.</p>
          </div>
        ) : (
          <div className="admin-dashboard__grid">
            <article className="admin-panel admin-panel--tall">
              <div className="admin-panel__header">
                <div>
                  <h3>Votes by post</h3>
                  <p>
                    Compare total votes recorded across posts within the
                    selected election.
                  </p>
                </div>
                <span className="admin-panel__pill">
                  <Vote size={14} />
                </span>
              </div>

              <div className="admin-panel__body">
                {chartData.length ? (
                  <div className="admin-chart admin-chart--md">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.08)"
                        />
                        <XAxis dataKey="name" stroke="#8fa3bc" hide />
                        <YAxis stroke="#8fa3bc" />
                        <Tooltip />
                        <Bar
                          dataKey="votes"
                          fill="#13c8e6"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="admin-empty-state">
                    <p>No post-level chart data is available.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel admin-panel--tall">
              <div className="admin-panel__header">
                <div>
                  <h3>Vote share by post</h3>
                  <p>
                    Review how total votes are distributed across the election
                    posts.
                  </p>
                </div>
                <span className="admin-panel__pill">
                  <PieChartIcon size={14} />
                </span>
              </div>

              <div className="admin-panel__body">
                {chartData.length ? (
                  <>
                    <div className="admin-chart admin-chart--md">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="votes"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={58}
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`${entry.name}-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="admin-legend-list">
                      {chartData.map((entry, index) => (
                        <div key={entry.name} className="admin-legend-item">
                          <span
                            className="admin-legend-item__dot"
                            style={{
                              background:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          <span className="admin-legend-item__label">
                            {entry.name}
                          </span>
                          <strong className="admin-legend-item__value">
                            {entry.votes}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="admin-empty-state">
                    <p>No post-level vote share data is available.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <h3>Leading candidates</h3>
                  <p>
                    Top candidates ranked by vote count across the selected
                    election.
                  </p>
                </div>
                <span className="admin-panel__pill">
                  <Trophy size={14} />
                </span>
              </div>

              <div className="admin-panel__body">
                {leadingCandidates.length ? (
                  <div className="admin-election-list">
                    {leadingCandidates.map((candidate, index) => {
                      const maxVotes = Math.max(
                        ...leadingCandidates.map((item) => item.votes),
                        1,
                      );
                      const width = `${(candidate.votes / maxVotes) * 100}%`;

                      return (
                        <article
                          key={`${candidate.postTitle}-${candidate.fullName}-${index}`}
                          className="admin-election-list__item"
                        >
                          <div className="admin-election-list__rank">
                            {index + 1}
                          </div>

                          <div className="admin-election-list__content">
                            <div className="admin-election-list__top">
                              <h4>{candidate.fullName}</h4>
                              <span className="admin-election-list__votes">
                                {candidate.votes} votes
                              </span>
                            </div>

                            <div className="admin-election-list__meta">
                              <span>{candidate.postTitle}</span>
                            </div>

                            <div className="admin-progress">
                              <div
                                className="admin-progress__bar"
                                style={{ width }}
                              />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="admin-empty-state">
                    <p>No candidate ranking data is available.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <h3>Post summary</h3>
                  <p>Quick summary of vote totals recorded under each post.</p>
                </div>
              </div>

              <div className="admin-panel__body">
                {posts.length ? (
                  <div className="admin-legend-list">
                    {posts.map((item, index) => (
                      <div
                        key={item?.post?._id || `${item?.post?.title}-${index}`}
                        className="admin-legend-item"
                      >
                        <span
                          className="admin-legend-item__dot"
                          style={{
                            background:
                              CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                        <span className="admin-legend-item__label">
                          {item?.post?.title || "Post"}
                        </span>
                        <strong className="admin-legend-item__value">
                          {safeNumber(item?.totalVotesCastForPost)} votes
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty-state">
                    <p>No post summary data is available.</p>
                  </div>
                )}
              </div>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}
