import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileBarChart2,
  LayoutDashboard,
  PieChart as PieChartIcon,
  Shield,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Vote,
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
import "../../styles/admin-light-theme.css";

const CHART_COLORS = [
  "#247a52",
  "#6750a4",
  "#f59e0b",
  "#ba3545",
  "#2f9d68",
  "#8b6fc8",
];

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "activity", label: "Activity", icon: Activity },
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
  return String(value)
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "active") return "adm-status adm-status--green";
  if (value === "ended") return "adm-status adm-status--purple";
  if (value === "approved") return "adm-status adm-status--green";
  if (value === "pending") return "adm-status adm-status--amber";
  if (value === "rejected") return "adm-status adm-status--red";

  return "adm-status";
}

function getAuditActor(log) {
  return (
    log?.actorId?.fullName ||
    log?.performedBy?.fullName ||
    log?.actorRole ||
    "System"
  );
}

function MetricCard({ label, value, helper, icon: Icon, tone = "green" }) {
  return (
    <article className={`adm-metric-card adm-metric-card--${tone}`}>
      <div className="adm-metric-card__icon">
        <Icon size={20} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{formatNumber(value)}</strong>
        {helper ? <p>{helper}</p> : null}
      </div>
    </article>
  );
}

function QuickAction({ to, icon: Icon, title, label }) {
  return (
    <Link to={to} className="adm-action-card">
      <div className="adm-action-card__icon">
        <Icon size={19} />
      </div>

      <div>
        <strong>{title}</strong>
        <span>{label}</span>
      </div>

      <ArrowRight size={17} />
    </Link>
  );
}

function ChartCard({ title, label, icon: Icon, children }) {
  return (
    <article className="adm-chart-card">
      <div className="adm-card-header">
        <div>
          <h3>{title}</h3>
          <span>{label}</span>
        </div>

        <div className="adm-card-header__icon">
          <Icon size={18} />
        </div>
      </div>

      <div className="adm-chart-card__body">{children}</div>
    </article>
  );
}

function EmptyBox({ text }) {
  return <div className="adm-empty-box">{text}</div>;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
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
      label: formatStatus(item?.status),
      value: safeNumber(item?.count),
    }));
  }, [verificationBreakdown]);

  const electionChartData = useMemo(() => {
    return elections.map((item, index) => {
      const title = String(item?.title || `Election ${index + 1}`);

      return {
        shortTitle: title.length > 14 ? `${title.slice(0, 14)}...` : title,
        totalVotes: safeNumber(item?.totalVotes),
      };
    });
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

  const topElections = useMemo(() => elections.slice(0, 5), [elections]);
  const latestAuditLogs = useMemo(() => auditLogs.slice(0, 6), [auditLogs]);

  const maxElectionVotes = useMemo(() => {
    return Math.max(
      ...topElections.map((election) => safeNumber(election?.totalVotes)),
      1,
    );
  }, [topElections]);

  const approvalRate = useMemo(() => {
    const totalVoters = safeNumber(stats.totalVoters);
    const verifiedVoters = safeNumber(stats.verifiedVoters);

    if (!totalVoters) return 0;

    return Math.round((verifiedVoters / totalVoters) * 100);
  }, [stats.totalVoters, stats.verifiedVoters]);

  if (loading) {
    return (
      <section className="adm-dashboard-page">
        <div className="adm-skeleton adm-skeleton--hero" />
        <div className="adm-metric-grid">
          <div className="adm-skeleton adm-skeleton--card" />
          <div className="adm-skeleton adm-skeleton--card" />
          <div className="adm-skeleton adm-skeleton--card" />
          <div className="adm-skeleton adm-skeleton--card" />
        </div>
        <div className="adm-skeleton adm-skeleton--panel" />
      </section>
    );
  }

  return (
    <section className="adm-dashboard-page">
      <section className="adm-dashboard-hero">
        <div>
          <span className="adm-eyebrow">
            <Shield size={15} />
            Admin overview
          </span>

          <h2>Control voting operations with a cleaner dashboard.</h2>

          <div className="adm-hero-actions">
            <Link className="adm-primary-btn" to={APP_ROUTES.ADMIN_ELECTIONS}>
              Manage Elections
              <ArrowRight size={16} />
            </Link>

            <Link className="adm-secondary-btn" to={APP_ROUTES.ADMIN_RESULTS}>
              View Analytics
            </Link>
          </div>
        </div>

        <div className="adm-hero-summary">
          <div>
            <span>Total Votes</span>
            <strong>{formatNumber(stats.totalVotes)}</strong>
          </div>

          <div>
            <span>Approval Rate</span>
            <strong>{approvalRate}%</strong>
          </div>

          <div>
            <span>Active Elections</span>
            <strong>{formatNumber(stats.activeElections)}</strong>
          </div>
        </div>
      </section>

      <div className="adm-tabs" role="tablist" aria-label="Dashboard sections">
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

      {activeTab === "overview" && (
        <div className="adm-tab-panel">
          <div className="adm-metric-grid">
            <MetricCard
              label="Elections"
              value={stats.totalElections}
              helper={`${formatNumber(stats.activeElections)} active now`}
              icon={Vote}
              tone="green"
            />

            <MetricCard
              label="Voters"
              value={stats.totalVoters}
              helper={`${formatNumber(stats.pendingVoters)} pending`}
              icon={Users}
              tone="purple"
            />

            <MetricCard
              label="Verified"
              value={stats.verifiedVoters}
              helper={`${approvalRate}% approval rate`}
              icon={UserCheck}
              tone="amber"
            />

            <MetricCard
              label="Candidates"
              value={stats.totalCandidates}
              helper={`${formatNumber(stats.approvedCandidates)} approved`}
              icon={BadgeCheck}
              tone="rose"
            />
          </div>

          <div className="adm-overview-grid">
            <article className="adm-panel-card">
              <div className="adm-card-header">
                <div>
                  <h3>Quick actions</h3>
                  <span>Most used admin operations</span>
                </div>

                <div className="adm-card-header__icon">
                  <ArrowRight size={18} />
                </div>
              </div>

              <div className="adm-action-grid">
                <QuickAction
                  to={APP_ROUTES.ADMIN_ELECTIONS}
                  icon={Vote}
                  title="Elections"
                  label="Create or publish"
                />

                <QuickAction
                  to={APP_ROUTES.ADMIN_VOTERS}
                  icon={Users}
                  title="Voters"
                  label="Approve pending"
                />

                <QuickAction
                  to={APP_ROUTES.ADMIN_CANDIDATES}
                  icon={BadgeCheck}
                  title="Candidates"
                  label="Review approvals"
                />

                <QuickAction
                  to={APP_ROUTES.ADMIN_RESULTS}
                  icon={Trophy}
                  title="Results"
                  label="Open analytics"
                />
              </div>
            </article>

            <article className="adm-panel-card">
              <div className="adm-card-header">
                <div>
                  <h3>Election status</h3>
                  <span>Current lifecycle counts</span>
                </div>

                <div className="adm-card-header__icon">
                  <CalendarClock size={18} />
                </div>
              </div>

              <div className="adm-status-stack">
                <div className="adm-status-row">
                  <span>Upcoming</span>
                  <strong>{formatNumber(stats.upcomingElections)}</strong>
                </div>

                <div className="adm-status-row">
                  <span>Active</span>
                  <strong>{formatNumber(stats.activeElections)}</strong>
                </div>

                <div className="adm-status-row">
                  <span>Ended</span>
                  <strong>{formatNumber(stats.endedElections)}</strong>
                </div>

                <div className="adm-status-row">
                  <span>Total posts</span>
                  <strong>{formatNumber(stats.totalPosts)}</strong>
                </div>
              </div>
            </article>
          </div>

          <article className="adm-panel-card">
            <div className="adm-card-header">
              <div>
                <h3>Top elections</h3>
                <span>Highest vote activity</span>
              </div>

              <Link className="adm-mini-link" to={APP_ROUTES.ADMIN_RESULTS}>
                Results
                <ArrowRight size={14} />
              </Link>
            </div>

            {topElections.length ? (
              <div className="adm-election-list">
                {topElections.map((election, index) => {
                  const votes = safeNumber(election?.totalVotes);
                  const width = `${(votes / maxElectionVotes) * 100}%`;

                  return (
                    <article
                      key={election.electionId || `${election.title}-${index}`}
                      className="adm-election-row"
                    >
                      <div className="adm-rank">{index + 1}</div>

                      <div className="adm-election-row__main">
                        <div className="adm-election-row__top">
                          <h4>{election?.title || "Election"}</h4>
                          <span>{formatNumber(votes)} votes</span>
                        </div>

                        <div className="adm-progress">
                          <div style={{ width }} />
                        </div>
                      </div>

                      <span className={getStatusClass(election?.status)}>
                        {formatStatus(election?.status)}
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyBox text="No election activity yet." />
            )}
          </article>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="adm-tab-panel">
          <div className="adm-chart-grid">
            <ChartCard
              title="Vote trend"
              label="Recent voting activity"
              icon={TrendingUp}
            >
              {voteTrendChartData.length ? (
                <div className="adm-chart-box adm-chart-box--medium">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={voteTrendChartData}>
                      <defs>
                        <linearGradient
                          id="admVotesArea"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#247a52"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="#247a52"
                            stopOpacity={0.04}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eadfce" />
                      <XAxis dataKey="label" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="votes"
                        stroke="#247a52"
                        fill="url(#admVotesArea)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyBox text="No vote trend data available." />
              )}
            </ChartCard>

            <ChartCard
              title="Voter verification"
              label="Approval distribution"
              icon={PieChartIcon}
            >
              {verificationChartData.length ? (
                <>
                  <div className="adm-chart-box adm-chart-box--medium">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={verificationChartData}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          outerRadius={92}
                          innerRadius={56}
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

                  <div className="adm-chart-legend">
                    {verificationChartData.map((entry, index) => (
                      <div key={entry.label}>
                        <span
                          style={{
                            background:
                              CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                        <strong>{entry.label}</strong>
                        <em>{formatNumber(entry.value)}</em>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyBox text="No verification data available." />
              )}
            </ChartCard>

            <ChartCard
              title="Election comparison"
              label="Votes by election"
              icon={BarChart3}
            >
              {electionChartData.length ? (
                <div className="adm-chart-box adm-chart-box--large">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={electionChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eadfce" />
                      <XAxis dataKey="shortTitle" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="totalVotes"
                        fill="#6750a4"
                        radius={[10, 10, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyBox text="No election comparison data available." />
              )}
            </ChartCard>

            <ChartCard
              title="Operational comparison"
              label="Votes vs approvals"
              icon={FileBarChart2}
            >
              {operationalTrendData.length ? (
                <div className="adm-chart-box adm-chart-box--large">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={operationalTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eadfce" />
                      <XAxis dataKey="label" stroke="#6b7280" />
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
                        dataKey="approvals"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyBox text="No operational comparison data available." />
              )}
            </ChartCard>
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="adm-tab-panel">
          <div className="adm-overview-grid">
            <article className="adm-panel-card">
              <div className="adm-card-header">
                <div>
                  <h3>Recent audit logs</h3>
                  <span>Latest recorded admin actions</span>
                </div>

                <Link className="adm-mini-link" to={APP_ROUTES.ADMIN_SYSTEM}>
                  View all
                  <ArrowRight size={14} />
                </Link>
              </div>

              {latestAuditLogs.length ? (
                <div className="adm-audit-list">
                  {latestAuditLogs.map((log, index) => (
                    <article
                      key={log._id || `${log.action}-${index}`}
                      className="adm-audit-row"
                    >
                      <div className="adm-audit-row__icon">
                        <Activity size={15} />
                      </div>

                      <div>
                        <h4>{log?.action || "System action"}</h4>
                        <p>{getAuditActor(log)}</p>
                      </div>

                      <span>{formatDateTime(log?.createdAt)}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyBox text="No audit logs available." />
              )}
            </article>

            <article className="adm-panel-card">
              <div className="adm-card-header">
                <div>
                  <h3>Operational summary</h3>
                  <span>Quick platform health</span>
                </div>

                <div className="adm-card-header__icon">
                  <CheckCircle2 size={18} />
                </div>
              </div>

              <div className="adm-status-stack">
                <div className="adm-status-row">
                  <span>Total votes</span>
                  <strong>{formatNumber(stats.totalVotes)}</strong>
                </div>

                <div className="adm-status-row">
                  <span>Active admins</span>
                  <strong>{formatNumber(stats.activeAdmins)}</strong>
                </div>

                <div className="adm-status-row">
                  <span>Super admins</span>
                  <strong>{formatNumber(stats.activeSuperAdmins)}</strong>
                </div>

                <div className="adm-status-row">
                  <span>Recent audit events</span>
                  <strong>{formatNumber(stats.recentAuditCount)}</strong>
                </div>

                <div className="adm-status-row">
                  <span>Rejected voters</span>
                  <strong>{formatNumber(stats.rejectedVoters)}</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}
