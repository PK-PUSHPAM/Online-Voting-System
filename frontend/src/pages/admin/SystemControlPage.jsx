import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Activity,
  ShieldCheck,
  RefreshCw,
  Search,
  ArrowLeft,
  ArrowRight,
  Filter,
  Clock3,
  UserCog,
  Shield,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
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
import { adminService } from "../../services/admin.service";
import { getApiErrorMessage, formatRoleLabel } from "../../lib/utils";
import "../../styles/system-control.css";

const PIE_COLORS = ["#6d72ff", "#15c7e5", "#22c55e", "#f59e0b", "#ef4444"];

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function buildActionKey(value) {
  return String(value || "Unknown").trim();
}

function StatCard({ title, value, subtitle, icon: Icon, tone = "primary" }) {
  return (
    <article className={`system-control-stat system-control-stat--${tone}`}>
      <div className="system-control-stat__top">
        <div>
          <p className="system-control-stat__label">{title}</p>
          <h3 className="system-control-stat__value">{value}</h3>
        </div>

        <div className="system-control-stat__icon">
          <Icon size={18} />
        </div>
      </div>

      <p className="system-control-stat__subtitle">{subtitle}</p>
    </article>
  );
}

function Panel({ title, description, action = null, children }) {
  return (
    <section className="system-control-panel">
      <div className="system-control-panel__header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>

        {action ? <div>{action}</div> : null}
      </div>

      <div className="system-control-panel__body">{children}</div>
    </section>
  );
}

function EmptyState({ label }) {
  return (
    <div className="system-control-empty">
      <p>{label}</p>
    </div>
  );
}

export default function SystemControlPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);

  const loadAuditLogs = async ({ silent = false, targetPage = page } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await adminService.getAuditLogs({
        page: targetPage,
        limit: 12,
        ...(appliedSearch ? { search: appliedSearch } : {}),
        ...(actionFilter ? { action: actionFilter } : {}),
      });

      setAuditLogs(Array.isArray(data?.items) ? data.items : []);
      setPagination(data?.pagination || null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setAuditLogs([]);
      setPagination(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAuditLogs({ targetPage: page });
  }, [page, appliedSearch, actionFilter]);

  const totalLogs = Number(pagination?.totalItems || auditLogs.length || 0);
  const currentPage = Math.max(1, Number(pagination?.currentPage || page));
  const totalPages = Math.max(1, Number(pagination?.totalPages || 1));

  const actionCounts = useMemo(() => {
    const map = new Map();

    for (const log of auditLogs) {
      const key = buildActionKey(log?.action);
      map.set(key, (map.get(key) || 0) + 1);
    }

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [auditLogs]);

  const actorRoleCounts = useMemo(() => {
    const map = new Map();

    for (const log of auditLogs) {
      const key = formatRoleLabel(log?.actorId?.role || "unknown");
      map.set(key, (map.get(key) || 0) + 1);
    }

    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [auditLogs]);

  const recentLogsCount = auditLogs.length;

  const superAdminActions = useMemo(
    () =>
      auditLogs.filter(
        (log) =>
          String(log?.actorId?.role || "").toLowerCase() === "super_admin",
      ).length,
    [auditLogs],
  );

  const adminActions = useMemo(
    () =>
      auditLogs.filter(
        (log) => String(log?.actorId?.role || "").toLowerCase() === "admin",
      ).length,
    [auditLogs],
  );

  const uniqueActors = useMemo(() => {
    const set = new Set();

    for (const log of auditLogs) {
      if (log?.actorId?._id) {
        set.add(log.actorId._id);
      }
    }

    return set.size;
  }, [auditLogs]);

  const topActions = actionCounts.slice(0, 5);

  const actionOptions = useMemo(() => {
    return actionCounts.map((item) => item.name).filter(Boolean);
  }, [actionCounts]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const handleResetFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setActionFilter("");
    setPage(1);
  };

  return (
    <section className="system-control-page">
      <div className="system-control-hero">
        <div className="system-control-hero__content">
          <span className="system-control-hero__badge">
            <ShieldCheck size={15} />
            Governance visibility
          </span>

          <h2>
            Without audit visibility, your admin panel is just blind power.
          </h2>

          <p>
            This screen exists to expose what happened, who did it, and how
            often. If system actions cannot be traced clearly, the product is
            not trustworthy.
          </p>

          <div className="system-control-hero__chips">
            <span>
              <Activity size={14} />
              Action tracking
            </span>
            <span>
              <UserCog size={14} />
              Actor accountability
            </span>
            <span>
              <Clock3 size={14} />
              Time-based visibility
            </span>
          </div>
        </div>

        <div className="system-control-hero__side">
          <div className="system-control-hero-card">
            <span>Control principle</span>
            <strong>
              Every sensitive action should leave a readable trail
            </strong>
            <p>
              Use this module to inspect action distribution, actor roles, and
              raw audit entries without digging through backend logs manually.
            </p>
          </div>
        </div>
      </div>

      <div className="system-control-stats">
        <StatCard
          title="Loaded Logs"
          value={formatNumber(totalLogs)}
          subtitle="Total logs matching current filters"
          icon={BarChart3}
          tone="primary"
        />

        <StatCard
          title="Current Page Entries"
          value={formatNumber(recentLogsCount)}
          subtitle="How many audit entries are visible right now"
          icon={Activity}
          tone="cyan"
        />

        <StatCard
          title="Unique Actors"
          value={formatNumber(uniqueActors)}
          subtitle="Distinct users who triggered visible actions"
          icon={Shield}
          tone="green"
        />

        <StatCard
          title="Super Admin Actions"
          value={formatNumber(superAdminActions)}
          subtitle="Visible actions performed by super admins"
          icon={CheckCircle2}
          tone="amber"
        />
      </div>

      <div className="system-control-grid">
        <Panel
          title="Filters"
          description="Search audit details, actor info, or narrow down by action."
          action={
            <button
              type="button"
              className="system-control-btn system-control-btn--soft"
              onClick={() =>
                loadAuditLogs({ silent: true, targetPage: currentPage })
              }
              disabled={refreshing}
            >
              <RefreshCw
                size={15}
                className={refreshing ? "spin-animation" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          }
        >
          <form
            className="system-control-filters"
            onSubmit={handleSearchSubmit}
          >
            <div className="system-control-search">
              <Search size={16} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by action, description, actor, email, target"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(event) => {
                setPage(1);
                setActionFilter(event.target.value);
              }}
            >
              <option value="">All Actions</option>
              {actionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="system-control-btn system-control-btn--secondary"
            >
              <Filter size={14} />
              Apply
            </button>

            <button
              type="button"
              className="system-control-btn system-control-btn--ghost"
              onClick={handleResetFilters}
            >
              Reset
            </button>
          </form>

          <div className="system-control-filter-summary">
            <span>
              Admin actions on current page:{" "}
              <strong>{formatNumber(adminActions)}</strong>
            </span>
            <span>
              Super admin actions on current page:{" "}
              <strong>{formatNumber(superAdminActions)}</strong>
            </span>
          </div>
        </Panel>

        <Panel
          title="Action Distribution"
          description="The most common visible actions on the current result set."
        >
          {topActions.length > 0 ? (
            <div className="system-control-chart system-control-chart--md">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topActions} barCategoryGap={24}>
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
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#6d72ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState label="No action distribution data available." />
          )}
        </Panel>

        <Panel
          title="Actor Role Split"
          description="Shows whether visible actions came from admin or super admin level operators."
        >
          {actorRoleCounts.length > 0 ? (
            <div className="system-control-chart system-control-chart--md">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={actorRoleCounts}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={72}
                    outerRadius={110}
                    paddingAngle={4}
                  >
                    {actorRoleCounts.map((item, index) => (
                      <Cell
                        key={`${item.name}-${index}`}
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
            <EmptyState label="No actor role split data available." />
          )}

          {actorRoleCounts.length > 0 && (
            <div className="system-control-legend">
              {actorRoleCounts.map((item, index) => (
                <div key={item.name} className="system-control-legend__item">
                  <span
                    className="system-control-legend__dot"
                    style={{
                      background: PIE_COLORS[index % PIE_COLORS.length],
                    }}
                  />
                  <span className="system-control-legend__label">
                    {item.name}
                  </span>
                  <strong className="system-control-legend__value">
                    {formatNumber(item.value)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Audit Log Stream"
          description="Raw action entries should remain readable without backend debugging."
        >
          {loading ? (
            <div className="system-control-loading">
              <div className="system-control-skeleton system-control-skeleton--row" />
              <div className="system-control-skeleton system-control-skeleton--row" />
              <div className="system-control-skeleton system-control-skeleton--row" />
            </div>
          ) : auditLogs.length === 0 ? (
            <EmptyState label="No audit logs found for current filters." />
          ) : (
            <>
              <div className="system-control-log-list">
                {auditLogs.map((log, index) => {
                  const actorName =
                    log?.actorId?.fullName ||
                    log?.actorId?.email ||
                    "Unknown actor";

                  const actorRole = formatRoleLabel(
                    log?.actorId?.role || "unknown",
                  );
                  const action = buildActionKey(log?.action);
                  const description =
                    log?.description ||
                    log?.details ||
                    "No description available.";
                  const targetLabel =
                    log?.targetType ||
                    log?.targetModel ||
                    log?.module ||
                    "General";

                  return (
                    <article
                      key={log?._id || `${action}-${index}`}
                      className="system-control-log-card"
                    >
                      <div className="system-control-log-card__line" />

                      <div className="system-control-log-card__body">
                        <div className="system-control-log-card__top">
                          <div>
                            <div className="system-control-log-card__chips">
                              <span className="system-control-action-pill">
                                {action}
                              </span>

                              <span className="system-control-target-pill">
                                {targetLabel}
                              </span>
                            </div>

                            <h4>{actorName}</h4>
                          </div>

                          <span className="system-control-log-card__time">
                            {formatDateTime(log?.createdAt)}
                          </span>
                        </div>

                        <p className="system-control-log-card__desc">
                          {description}
                        </p>

                        <div className="system-control-log-card__meta">
                          <span>{actorRole}</span>
                          <span>{log?.actorId?.email || "-"}</span>
                          <span>{log?.actorId?.mobileNumber || "-"}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="system-control-pagination">
                <div className="system-control-pagination__info">
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <strong>{formatNumber(totalLogs)} total records</strong>
                </div>

                <div className="system-control-pagination__actions">
                  <button
                    type="button"
                    className="system-control-btn system-control-btn--ghost"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ArrowLeft size={14} />
                    Previous
                  </button>

                  <button
                    type="button"
                    className="system-control-btn system-control-btn--ghost"
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage >= totalPages}
                  >
                    Next
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>
    </section>
  );
}
