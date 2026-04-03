import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Clock3,
  Shield,
  Users,
  Vote,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
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
import { adminService } from "../../services/admin.service";
import { APP_ROUTES } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";
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

const getStatusToneClass = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "active") return "admin-status-pill admin-status-pill--active";
  if (value === "ended") return "admin-status-pill admin-status-pill--ended";
  return "admin-status-pill admin-status-pill--upcoming";
};

const formatVerificationLabel = (status) => {
  const value = String(status || "unknown").replaceAll("_", " ");
  return value.charAt(0).toUpperCase() + value.slice(1);
};

function StatCard({ label, value, meta, icon: Icon, tone }) {
  return (
    <article className={`admin-stat-card admin-stat-card--${tone}`}>
      <div className="admin-stat-card__top">
        <div>
          <p className="admin-stat-card__label">{label}</p>
          <h3 className="admin-stat-card__value">{value}</h3>
        </div>

        <div className="admin-stat-card__icon">
          <Icon size={20} />
        </div>
      </div>

      <p className="admin-stat-card__meta">{meta}</p>
    </article>
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await adminService.getDashboardSummary();
        setSummary(data || null);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = summary?.stats || {};
  const elections = Array.isArray(summary?.elections) ? summary.elections : [];
  const auditLogs = Array.isArray(summary?.auditLogs) ? summary.auditLogs : [];
  const voteTrends = Array.isArray(summary?.voteTrends)
    ? summary.voteTrends
    : [];
  const verificationBreakdown = Array.isArray(summary?.verificationBreakdown)
    ? summary.verificationBreakdown
    : [];

  const voteTrendChartData = useMemo(() => {
    return voteTrends.map((item, index) => ({
      label: item?.date || `Point ${index + 1}`,
      votes: safeNumber(item?.votes),
    }));
  }, [voteTrends]);

  const verificationChartData = useMemo(() => {
    return verificationBreakdown.map((item) => ({
      label: formatVerificationLabel(item?.status),
      value: safeNumber(item?.count),
    }));
  }, [verificationBreakdown]);

  const electionChartData = useMemo(() => {
    return elections.map((item, index) => ({
      shortTitle:
        String(item?.title || `Election ${index + 1}`).length > 16
          ? `${String(item?.title).slice(0, 16)}...`
          : String(item?.title || `Election ${index + 1}`),
      totalVotes: safeNumber(item?.totalVotes),
    }));
  }, [elections]);

  const operationalTrendData = useMemo(() => {
    const maxLength = Math.max(
      voteTrendChartData.length,
      verificationChartData.length,
      0,
    );

    return Array.from({ length: maxLength }, (_, index) => ({
      label:
        voteTrendChartData[index]?.label ||
        verificationChartData[index]?.label ||
        `Point ${index + 1}`,
      votes: safeNumber(voteTrendChartData[index]?.votes),
      approvals: safeNumber(verificationChartData[index]?.value),
    }));
  }, [voteTrendChartData, verificationChartData]);

  const latestAuditLogs = useMemo(() => auditLogs.slice(0, 5), [auditLogs]);
  const topElections = useMemo(() => elections.slice(0, 5), [elections]);

  const maxElectionVotes = useMemo(() => {
    return Math.max(
      ...topElections.map((item) => safeNumber(item?.totalVotes)),
      1,
    );
  }, [topElections]);

  return (
    <section className="admin-dashboard">
      {loading ? (
        <>
          <div className="admin-skeleton admin-skeleton--hero" />
          <div className="admin-dashboard__stats">
            <div className="admin-skeleton admin-skeleton--card" />
            <div className="admin-skeleton admin-skeleton--card" />
            <div className="admin-skeleton admin-skeleton--card" />
            <div className="admin-skeleton admin-skeleton--card" />
          </div>
          <div className="admin-dashboard__grid">
            <div className="admin-skeleton admin-skeleton--panel" />
            <div className="admin-skeleton admin-skeleton--panel" />
            <div className="admin-skeleton admin-skeleton--panel-wide" />
          </div>
        </>
      ) : (
        <>
          <section className="admin-dashboard__hero">
            <div className="admin-dashboard__hero-copy">
              <span className="admin-dashboard__hero-badge">
                <Shield size={15} />
                Administrative overview
              </span>

              <h2>
                Monitor election performance, voter verification, and
                administrative activity from one dashboard.
              </h2>

              <p>
                This dashboard provides a consolidated operational summary of
                the platform, including election participation, voter
                verification distribution, and recent administrative events.
              </p>

              <div className="admin-dashboard__hero-actions">
                <Link
                  className="admin-cta-btn admin-cta-btn--primary"
                  to={APP_ROUTES.ADMIN_ELECTIONS}
                >
                  Manage Elections
                  <ArrowRight size={16} />
                </Link>

                <Link
                  className="admin-cta-btn admin-cta-btn--secondary"
                  to={APP_ROUTES.ADMIN_RESULTS}
                >
                  Open Results Analytics
                </Link>
              </div>

              <div className="admin-dashboard__quick-metrics">
                <span className="admin-quick-chip">
                  <Vote size={15} />
                  Total votes: {safeNumber(stats.totalVotes)}
                </span>

                <span className="admin-quick-chip">
                  <Users size={15} />
                  Total voters: {safeNumber(stats.totalVoters)}
                </span>

                <span className="admin-quick-chip">
                  <BadgeCheck size={15} />
                  Active elections: {safeNumber(stats.activeElections)}
                </span>
              </div>
            </div>

            <div className="admin-dashboard__hero-grid">
              <div className="admin-hero-mini-card">
                <span>Total elections</span>
                <strong>{safeNumber(stats.totalElections)}</strong>
              </div>

              <div className="admin-hero-mini-card">
                <span>Total voters</span>
                <strong>{safeNumber(stats.totalVoters)}</strong>
              </div>

              <div className="admin-hero-mini-card">
                <span>Pending approvals</span>
                <strong>{safeNumber(stats.pendingVoters)}</strong>
              </div>

              <div className="admin-hero-mini-card">
                <span>Total admins</span>
                <strong>{safeNumber(stats.totalAdmins)}</strong>
              </div>
            </div>
          </section>

          <section className="admin-dashboard__stats">
            <StatCard
              label="Total Elections"
              value={safeNumber(stats.totalElections)}
              meta="All elections currently registered in the system."
              icon={Vote}
              tone="primary"
            />

            <StatCard
              label="Active Elections"
              value={safeNumber(stats.activeElections)}
              meta="Elections currently open for participation."
              icon={BadgeCheck}
              tone="cyan"
            />

            <StatCard
              label="Verified Voters"
              value={safeNumber(stats.verifiedVoters)}
              meta="Voter accounts that have completed approval requirements."
              icon={UserCheck}
              tone="green"
            />

            <StatCard
              label="Pending Voters"
              value={safeNumber(stats.pendingVoters)}
              meta="Accounts currently waiting for administrative review."
              icon={Clock3}
              tone="amber"
            />
          </section>

          <section className="admin-dashboard__grid">
            <article className="admin-panel admin-panel--tall">
              <div className="admin-panel__header">
                <div>
                  <h3>Vote Trend Overview</h3>
                  <p>Track voting activity across recent reporting dates.</p>
                </div>
                <span className="admin-panel__pill">Trend</span>
              </div>

              <div className="admin-panel__body">
                {voteTrendChartData.length ? (
                  <div className="admin-chart admin-chart--md">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={voteTrendChartData}>
                        <defs>
                          <linearGradient
                            id="votesArea"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#6d72ff"
                              stopOpacity={0.45}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6d72ff"
                              stopOpacity={0.04}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.08)"
                        />
                        <XAxis dataKey="label" stroke="#8fa3bc" />
                        <YAxis stroke="#8fa3bc" />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="votes"
                          stroke="#6d72ff"
                          fillOpacity={1}
                          fill="url(#votesArea)"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="admin-empty-state">
                    <p>No vote trend data is available yet.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel admin-panel--tall">
              <div className="admin-panel__header">
                <div>
                  <h3>Verification Breakdown</h3>
                  <p>Review voter verification states across the platform.</p>
                </div>
                <span className="admin-panel__pill">Distribution</span>
              </div>

              <div className="admin-panel__body">
                {verificationChartData.length ? (
                  <>
                    <div className="admin-chart admin-chart--md">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={verificationChartData}
                            dataKey="value"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={58}
                          >
                            {verificationChartData.map((entry, index) => (
                              <Cell
                                key={`${entry.label}-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="admin-legend-list">
                      {verificationChartData.map((entry, index) => (
                        <div key={entry.label} className="admin-legend-item">
                          <span
                            className="admin-legend-item__dot"
                            style={{
                              background:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          <span className="admin-legend-item__label">
                            {entry.label}
                          </span>
                          <strong className="admin-legend-item__value">
                            {entry.value}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="admin-empty-state">
                    <p>No verification breakdown data is available yet.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <h3>Election Comparison</h3>
                  <p>Compare visible vote totals across the top elections.</p>
                </div>
                <span className="admin-panel__pill">
                  <BarChart3 size={14} />
                </span>
              </div>

              <div className="admin-panel__body">
                {electionChartData.length ? (
                  <div className="admin-chart admin-chart--lg">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={electionChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.08)"
                        />
                        <XAxis dataKey="shortTitle" stroke="#8fa3bc" />
                        <YAxis stroke="#8fa3bc" />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="totalVotes"
                          fill="#13c8e6"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="admin-empty-state">
                    <p>No election comparison data is available yet.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <h3>Operational Comparison</h3>
                  <p>Compare recent vote counts with verification counts.</p>
                </div>
                <span className="admin-panel__pill">
                  <Activity size={14} />
                </span>
              </div>

              <div className="admin-panel__body">
                {operationalTrendData.length ? (
                  <div className="admin-chart admin-chart--lg">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={operationalTrendData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.08)"
                        />
                        <XAxis dataKey="label" stroke="#8fa3bc" />
                        <YAxis stroke="#8fa3bc" />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="votes"
                          stroke="#6d72ff"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="approvals"
                          stroke="#22c55e"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="admin-empty-state">
                    <p>No operational comparison data is available yet.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <h3>Top Elections by Activity</h3>
                  <p>Review elections with the highest recorded vote volume.</p>
                </div>
                <Link
                  to={APP_ROUTES.ADMIN_RESULTS}
                  className="admin-panel__pill"
                >
                  Results
                </Link>
              </div>

              <div className="admin-panel__body">
                {topElections.length ? (
                  <div className="admin-election-list">
                    {topElections.map((election, index) => {
                      const votes = safeNumber(election?.totalVotes);
                      const width = `${(votes / maxElectionVotes) * 100}%`;

                      return (
                        <article
                          key={
                            election.electionId || `${election.title}-${index}`
                          }
                          className="admin-election-list__item"
                        >
                          <div className="admin-election-list__rank">
                            {index + 1}
                          </div>

                          <div className="admin-election-list__content">
                            <div className="admin-election-list__top">
                              <h4>{election?.title || "Election"}</h4>
                              <span className="admin-election-list__votes">
                                {votes} votes
                              </span>
                            </div>

                            <div className="admin-election-list__meta">
                              <span
                                className={getStatusToneClass(election?.status)}
                              >
                                {election?.status || "upcoming"}
                              </span>
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
                    <p>No election activity data is available yet.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <h3>Recent Administrative Actions</h3>
                  <p>
                    Track the most recent audit events recorded by the system.
                  </p>
                </div>
                <Link
                  to={APP_ROUTES.ADMIN_SYSTEM}
                  className="admin-panel__pill"
                >
                  Audit Log
                </Link>
              </div>

              <div className="admin-panel__body">
                {latestAuditLogs.length ? (
                  <div className="admin-audit-list">
                    {latestAuditLogs.map((log, index) => (
                      <article
                        key={log._id || `${log.action}-${index}`}
                        className="admin-audit-item"
                      >
                        <div className="admin-audit-item__marker" />

                        <div className="admin-audit-item__body">
                          <div className="admin-audit-item__top">
                            <h4>{log?.action || "Administrative action"}</h4>
                            <span>
                              {log?.createdAt
                                ? new Date(log.createdAt).toLocaleString()
                                : "-"}
                            </span>
                          </div>

                          <p className="admin-audit-item__desc">
                            {log?.description ||
                              "No description available for this event."}
                          </p>

                          <div className="admin-audit-item__meta">
                            <span className="admin-role-chip">
                              <Shield size={13} />
                              {log?.actorId?.role || "system"}
                            </span>

                            <span>{log?.actorId?.fullName || "System"}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty-state">
                    <p>No recent audit entries are available.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <h3>Operational Summary</h3>
                  <p>Key platform counts for administration and monitoring.</p>
                </div>
                <span className="admin-panel__pill">
                  <AlertTriangle size={14} />
                </span>
              </div>

              <div className="admin-panel__body">
                <div className="admin-legend-list">
                  <div className="admin-legend-item">
                    <span
                      className="admin-legend-item__dot"
                      style={{ background: "#6d72ff" }}
                    />
                    <span className="admin-legend-item__label">
                      Total votes cast
                    </span>
                    <strong className="admin-legend-item__value">
                      {safeNumber(stats.totalVotes)}
                    </strong>
                  </div>

                  <div className="admin-legend-item">
                    <span
                      className="admin-legend-item__dot"
                      style={{ background: "#13c8e6" }}
                    />
                    <span className="admin-legend-item__label">
                      Active admins
                    </span>
                    <strong className="admin-legend-item__value">
                      {safeNumber(stats.activeAdmins)}
                    </strong>
                  </div>

                  <div className="admin-legend-item">
                    <span
                      className="admin-legend-item__dot"
                      style={{ background: "#22c55e" }}
                    />
                    <span className="admin-legend-item__label">
                      Approved candidates
                    </span>
                    <strong className="admin-legend-item__value">
                      {safeNumber(stats.approvedCandidates)}
                    </strong>
                  </div>

                  <div className="admin-legend-item">
                    <span
                      className="admin-legend-item__dot"
                      style={{ background: "#f59e0b" }}
                    />
                    <span className="admin-legend-item__label">
                      Pending voters
                    </span>
                    <strong className="admin-legend-item__value">
                      {safeNumber(stats.pendingVoters)}
                    </strong>
                  </div>

                  <div className="admin-legend-item">
                    <span
                      className="admin-legend-item__dot"
                      style={{ background: "#ef4444" }}
                    />
                    <span className="admin-legend-item__label">
                      Rejected voters
                    </span>
                    <strong className="admin-legend-item__value">
                      {safeNumber(stats.rejectedVoters)}
                    </strong>
                  </div>
                </div>
              </div>
            </article>
          </section>
        </>
      )}
    </section>
  );
}
