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
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  Vote,
  UserCheck,
  Clock3,
  Shield,
  Activity,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  UserSquare2,
  Briefcase,
} from "lucide-react";
import { adminService } from "../../services/admin.service";
import { getApiErrorMessage } from "../../lib/utils";

const PIE_COLORS = ["#6d72ff", "#15c7e5", "#22c55e"];
const ELECTION_BAR_COLORS = ["#f59e0b", "#22c55e", "#ef4444"];

function formatNumber(value) {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat("en-IN").format(numericValue);
}

function StatCard({ title, value, subtitle, icon: Icon, tone = "primary" }) {
  return (
    <article className={`admin-stat-card admin-stat-card--${tone}`}>
      <div className="admin-stat-card__top">
        <div>
          <p className="admin-stat-card__label">{title}</p>
          <h3 className="admin-stat-card__value">{formatNumber(value)}</h3>
        </div>

        <div className="admin-stat-card__icon">
          <Icon size={18} />
        </div>
      </div>

      <p className="admin-stat-card__meta">{subtitle}</p>
    </article>
  );
}

function Panel({ title, description, action, children, tall = false }) {
  return (
    <section className={`admin-panel ${tall ? "admin-panel--tall" : ""}`}>
      <div className="admin-panel__header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>

        {action ? <div className="admin-panel__action">{action}</div> : null}
      </div>

      <div className="admin-panel__body">{children}</div>
    </section>
  );
}

function EmptyPanelState({ label }) {
  return (
    <div className="admin-empty-state">
      <p>{label}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <section className="admin-dashboard">
      <div className="admin-dashboard__hero admin-skeleton admin-skeleton--hero" />

      <div className="admin-dashboard__stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="admin-skeleton admin-skeleton--card" />
        ))}
      </div>

      <div className="admin-dashboard__grid">
        <div className="admin-skeleton admin-skeleton--panel" />
        <div className="admin-skeleton admin-skeleton--panel" />
        <div className="admin-skeleton admin-skeleton--panel-wide" />
      </div>
    </section>
  );
}

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await adminService.getDashboardSummary();
      setDashboardData(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const counters = dashboardData?.counters || {};
  const recentAuditLogs = Array.isArray(dashboardData?.recentAuditLogs)
    ? dashboardData.recentAuditLogs
    : [];
  const topActiveElectionsByVotes = Array.isArray(
    dashboardData?.topActiveElectionsByVotes,
  )
    ? dashboardData.topActiveElectionsByVotes
    : [];

  const voterApprovalData = useMemo(
    () => [
      {
        name: "Pending",
        value: Number(counters?.pendingVoters || 0),
      },
      {
        name: "Approved",
        value: Number(counters?.approvedVoters || 0),
      },
      {
        name: "Rejected",
        value: Number(counters?.rejectedVoters || 0),
      },
    ],
    [
      counters?.pendingVoters,
      counters?.approvedVoters,
      counters?.rejectedVoters,
    ],
  );

  const electionStatusData = useMemo(
    () => [
      {
        name: "Upcoming",
        value: Number(counters?.upcomingElections || 0),
      },
      {
        name: "Active",
        value: Number(counters?.activeElections || 0),
      },
      {
        name: "Ended",
        value: Number(counters?.endedElections || 0),
      },
    ],
    [
      counters?.upcomingElections,
      counters?.activeElections,
      counters?.endedElections,
    ],
  );

  const systemOverviewData = useMemo(
    () => [
      {
        name: "Users",
        value: Number(counters?.totalUsers || 0),
      },
      {
        name: "Voters",
        value: Number(counters?.totalVoters || 0),
      },
      {
        name: "Posts",
        value: Number(counters?.totalPosts || 0),
      },
      {
        name: "Candidates",
        value: Number(counters?.totalCandidates || 0),
      },
      {
        name: "Votes",
        value: Number(counters?.totalVotes || 0),
      },
    ],
    [
      counters?.totalUsers,
      counters?.totalVoters,
      counters?.totalPosts,
      counters?.totalCandidates,
      counters?.totalVotes,
    ],
  );

  const approvalRate = useMemo(() => {
    const totalVoters = Number(counters?.totalVoters || 0);
    const approvedVoters = Number(counters?.approvedVoters || 0);

    if (!totalVoters) return 0;

    return Math.round((approvedVoters / totalVoters) * 100);
  }, [counters?.totalVoters, counters?.approvedVoters]);

  const electionParticipationSummary = useMemo(() => {
    const totalElections = Number(counters?.totalElections || 0);
    const activeElections = Number(counters?.activeElections || 0);

    if (!totalElections) return 0;

    return Math.round((activeElections / totalElections) * 100);
  }, [counters?.totalElections, counters?.activeElections]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <section className="admin-dashboard">
      <div className="admin-dashboard__hero">
        <div className="admin-dashboard__hero-copy">
          <span className="admin-dashboard__hero-badge">
            <TrendingUp size={15} />
            Live operational overview
          </span>

          <h2>Run the whole voting platform from one clear dashboard.</h2>

          <p>
            This screen is where admin UX should feel serious, not amateur.
            Numbers first. Clarity first. Control first.
          </p>

          <div className="admin-dashboard__hero-actions">
            <button
              type="button"
              className="admin-cta-btn admin-cta-btn--primary"
              onClick={() => loadDashboard({ silent: true })}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "spin-animation" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh dashboard"}
            </button>

            <div className="admin-hero-inline-stats">
              <span>
                <CheckCircle2 size={14} />
                Approval rate: {approvalRate}%
              </span>
              <span>
                <Activity size={14} />
                Active election ratio: {electionParticipationSummary}%
              </span>
            </div>
          </div>
        </div>

        <div className="admin-dashboard__hero-grid">
          <div className="admin-hero-mini-card">
            <span>Active admins</span>
            <strong>{formatNumber(counters?.activeAdmins || 0)}</strong>
          </div>

          <div className="admin-hero-mini-card">
            <span>Super admins</span>
            <strong>{formatNumber(counters?.activeSuperAdmins || 0)}</strong>
          </div>

          <div className="admin-hero-mini-card">
            <span>Approved candidates</span>
            <strong>{formatNumber(counters?.approvedCandidates || 0)}</strong>
          </div>

          <div className="admin-hero-mini-card">
            <span>7-day audit activity</span>
            <strong>{formatNumber(counters?.recentAuditCount || 0)}</strong>
          </div>
        </div>
      </div>

      <div className="admin-dashboard__stats">
        <StatCard
          title="Total Users"
          value={counters?.totalUsers || 0}
          subtitle="All accounts currently present in the system"
          icon={Users}
          tone="primary"
        />

        <StatCard
          title="Total Votes"
          value={counters?.totalVotes || 0}
          subtitle="All vote records cast across elections"
          icon={Vote}
          tone="cyan"
        />

        <StatCard
          title="Approved Voters"
          value={counters?.approvedVoters || 0}
          subtitle="Verified voter accounts cleared for participation"
          icon={UserCheck}
          tone="green"
        />

        <StatCard
          title="Pending Approvals"
          value={counters?.pendingVoters || 0}
          subtitle="Registrations still waiting for verification"
          icon={Clock3}
          tone="amber"
        />
      </div>

      <div className="admin-dashboard__quick-metrics">
        <div className="admin-quick-chip">
          <Shield size={15} />
          Active Admins: {formatNumber(counters?.activeAdmins || 0)}
        </div>

        <div className="admin-quick-chip">
          <Briefcase size={15} />
          Total Posts: {formatNumber(counters?.totalPosts || 0)}
        </div>

        <div className="admin-quick-chip">
          <UserSquare2 size={15} />
          Total Candidates: {formatNumber(counters?.totalCandidates || 0)}
        </div>

        <div className="admin-quick-chip">
          <AlertTriangle size={15} />
          Rejected Voters: {formatNumber(counters?.rejectedVoters || 0)}
        </div>
      </div>

      <div className="admin-dashboard__grid">
        <Panel
          title="Election Status Distribution"
          description="How elections are currently spread across upcoming, active, and ended states."
          tall
        >
          {electionStatusData.some((item) => item.value > 0) ? (
            <div className="admin-chart admin-chart--md">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={electionStatusData} barCategoryGap={28}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#94a3b8"
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
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {electionStatusData.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={
                          ELECTION_BAR_COLORS[
                            index % ELECTION_BAR_COLORS.length
                          ]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyPanelState label="No election status data available yet." />
          )}
        </Panel>

        <Panel
          title="Voter Verification Breakdown"
          description="Use this to instantly see approval backlog and verification health."
          tall
        >
          {voterApprovalData.some((item) => item.value > 0) ? (
            <div className="admin-chart admin-chart--md">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={voterApprovalData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={72}
                    outerRadius={112}
                    paddingAngle={4}
                  >
                    {voterApprovalData.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
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
            <EmptyPanelState label="No voter verification data available yet." />
          )}

          <div className="admin-legend-list">
            {voterApprovalData.map((item, index) => (
              <div key={item.name} className="admin-legend-item">
                <span
                  className="admin-legend-item__dot"
                  style={{
                    background: PIE_COLORS[index % PIE_COLORS.length],
                  }}
                />
                <span className="admin-legend-item__label">{item.name}</span>
                <strong className="admin-legend-item__value">
                  {formatNumber(item.value)}
                </strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="System Volume Snapshot"
          description="A clean view of scale across users, voters, posts, candidates, and votes."
          action={
            <span className="admin-panel__pill">
              Updated from dashboard summary API
            </span>
          }
        >
          {systemOverviewData.some((item) => item.value > 0) ? (
            <div className="admin-chart admin-chart--lg">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={systemOverviewData}>
                  <defs>
                    <linearGradient
                      id="systemVolumeFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#6d72ff"
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="100%"
                        stopColor="#6d72ff"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#94a3b8"
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
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6d72ff"
                    strokeWidth={3}
                    fill="url(#systemVolumeFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyPanelState label="No system volume data available yet." />
          )}
        </Panel>

        <Panel
          title="Top Elections by Votes"
          description="This should quickly expose which elections are generating the most participation."
          tall
        >
          {topActiveElectionsByVotes.length > 0 ? (
            <div className="admin-election-list">
              {topActiveElectionsByVotes.map((item, index) => (
                <div
                  key={`${item?.electionId || item?.title}-${index}`}
                  className="admin-election-list__item"
                >
                  <div className="admin-election-list__rank">#{index + 1}</div>

                  <div className="admin-election-list__content">
                    <div className="admin-election-list__top">
                      <h4>{item?.title || "Untitled election"}</h4>
                      <span className="admin-election-list__votes">
                        {formatNumber(item?.totalVotes || 0)} votes
                      </span>
                    </div>

                    <div className="admin-election-list__meta">
                      <span
                        className={`admin-status-pill admin-status-pill--${String(item?.status || "upcoming").toLowerCase()}`}
                      >
                        {String(item?.status || "upcoming")}
                      </span>
                      <span>
                        {item?.isPublished
                          ? "Published"
                          : "Draft / Unpublished"}
                      </span>
                    </div>

                    <div className="admin-progress">
                      <div
                        className="admin-progress__bar"
                        style={{
                          width: `${
                            topActiveElectionsByVotes[0]?.totalVotes
                              ? Math.max(
                                  12,
                                  Math.round(
                                    ((item?.totalVotes || 0) /
                                      topActiveElectionsByVotes[0].totalVotes) *
                                      100,
                                  ),
                                )
                              : 12
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanelState label="No election vote ranking data available yet." />
          )}
        </Panel>

        <Panel
          title="Recent Audit Activity"
          description="Last recorded system operations. This is critical for trust, tracking, and governance."
          tall
        >
          {recentAuditLogs.length > 0 ? (
            <div className="admin-audit-list">
              {recentAuditLogs.map((log, index) => {
                const actorName =
                  log?.actorId?.fullName ||
                  log?.actorId?.email ||
                  "Unknown actor";

                const actorRole = log?.actorId?.role || "unknown";

                const action = log?.action || "Unknown action";

                const description =
                  log?.description ||
                  log?.details ||
                  "No description available.";

                return (
                  <article
                    key={log?._id || `${action}-${index}`}
                    className="admin-audit-item"
                  >
                    <div className="admin-audit-item__marker" />

                    <div className="admin-audit-item__body">
                      <div className="admin-audit-item__top">
                        <h4>{action}</h4>
                        <span>
                          {log?.createdAt
                            ? new Date(log.createdAt).toLocaleString()
                            : "Unknown time"}
                        </span>
                      </div>

                      <p className="admin-audit-item__desc">{description}</p>

                      <div className="admin-audit-item__meta">
                        <span>{actorName}</span>
                        <span className="admin-role-chip">
                          {String(actorRole).replaceAll("_", " ")}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyPanelState label="No audit logs available yet." />
          )}
        </Panel>
      </div>
    </section>
  );
}
