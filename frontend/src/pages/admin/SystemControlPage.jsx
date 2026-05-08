import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Ban,
  FileSearch,
  Filter,
  LayoutGrid,
  MessageCircle,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  UserRoundX,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services/admin.service";
import { publicChatService } from "../../services/publicChat.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";
import "../../styles/admin-light-theme.css";

const AUDIT_LIMIT = 10;
const BLOCK_LIMIT = 10;

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "audit", label: "Audit Logs", icon: FileSearch },
  { id: "blockedChat", label: "Chat Blocks", icon: Ban },
];

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

function getInitials(name = "User") {
  const parts = String(name || "User")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

function getActorName(log) {
  return (
    log?.actorId?.fullName ||
    log?.performedBy?.fullName ||
    log?.meta?.fullName ||
    log?.meta?.email ||
    "System"
  );
}

function getActorEmail(log) {
  return log?.actorId?.email || log?.meta?.email || "";
}

function getActorRole(log) {
  return (
    log?.actorId?.role || log?.performedBy?.role || log?.actorRole || "system"
  );
}

function getTargetId(log) {
  if (!log?.targetId) return "";
  return String(log.targetId).slice(-8);
}

function getLogMessage(log) {
  if (log?.description) return log.description;
  if (log?.message) return log.message;

  if (log?.meta?.reason) return log.meta.reason;
  if (log?.meta?.rejectionReason) return log.meta.rejectionReason;

  if (log?.action) {
    return `Recorded action: ${log.action}`;
  }

  return "No description is available for this audit event.";
}

function MetricCard({ icon: Icon, label, value, helper, tone = "green" }) {
  return (
    <article className={`asc2-metric-card asc2-metric-card--${tone}`}>
      <div className="asc2-metric-card__icon">
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

function AuditLogCard({ log }) {
  return (
    <article className="asc2-audit-card">
      <div className="asc2-audit-card__icon">
        <Activity size={17} />
      </div>

      <div className="asc2-audit-card__main">
        <div className="asc2-audit-card__top">
          <h4>{log?.action || "System action"}</h4>
          <span>{formatDateTime(log?.createdAt)}</span>
        </div>

        <p>{getLogMessage(log)}</p>

        <div className="asc2-chip-row">
          <span className="asc2-chip">
            <ShieldCheck size={13} />
            {getActorName(log)}
          </span>

          <span className="asc2-chip">
            <Shield size={13} />
            {getActorRole(log)}
          </span>

          {getActorEmail(log) ? (
            <span className="asc2-chip">{getActorEmail(log)}</span>
          ) : null}

          {log?.targetType ? (
            <span className="asc2-chip">{log.targetType}</span>
          ) : null}

          {getTargetId(log) ? (
            <span className="asc2-chip">ID: {getTargetId(log)}</span>
          ) : null}

          {log?.status ? (
            <span
              className={
                log.status === "success"
                  ? "asc2-chip asc2-chip--success"
                  : "asc2-chip asc2-chip--danger"
              }
            >
              {log.status}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function BlockedUserCard({ block, unblockingUserId, onUnblock }) {
  const blockedUser = block?.userId || {};
  const blockedBy = block?.blockedBy || {};
  const initials = getInitials(blockedUser?.fullName || "User");

  return (
    <article className="asc2-block-card">
      <div className="asc2-block-card__top">
        <div className="asc2-block-avatar">
          {blockedUser?.profilePhotoUrl ? (
            <img
              src={blockedUser.profilePhotoUrl}
              alt={blockedUser.fullName || "Blocked user"}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="asc2-block-title">
          <h4>{blockedUser?.fullName || "Blocked user"}</h4>
          <p>{blockedUser?.email || "No email available"}</p>
        </div>

        <span className="asc2-status asc2-status--danger">
          <Ban size={13} />
          Blocked
        </span>
      </div>

      <div className="asc2-block-meta">
        <div>
          <span>Role</span>
          <strong>{blockedUser?.role || "-"}</strong>
        </div>

        <div>
          <span>Blocked by</span>
          <strong>{blockedBy?.fullName || "Admin"}</strong>
        </div>

        <div>
          <span>Blocked at</span>
          <strong>{formatDateTime(block?.createdAt)}</strong>
        </div>
      </div>

      <div className="asc2-reason-box">
        <MessageCircle size={15} />
        <div>
          <strong>Reason</strong>
          <p>
            {block?.reason || "No reason was provided by the administrator."}
          </p>
        </div>
      </div>

      <div className="asc2-block-card__actions">
        <button
          type="button"
          className="adm-primary-btn"
          onClick={() => onUnblock(block)}
          disabled={unblockingUserId === blockedUser?._id}
        >
          <Unlock size={15} />
          {unblockingUserId === blockedUser?._id
            ? "Unblocking..."
            : "Unblock User"}
        </button>
      </div>
    </article>
  );
}

export default function SystemControlPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const [logs, setLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState(null);
  const [auditPage, setAuditPage] = useState(1);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditError, setAuditError] = useState("");

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedPagination, setBlockedPagination] = useState(null);
  const [blockedPage, setBlockedPage] = useState(1);
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false);
  const [unblockingUserId, setUnblockingUserId] = useState("");

  const auditTotal = Number(auditPagination?.totalItems || logs.length || 0);
  const blockedTotal = Number(
    blockedPagination?.totalItems || blockedUsers.length || 0,
  );

  const stats = useMemo(() => {
    const adminActions = logs.filter((log) => {
      const role = String(getActorRole(log)).toLowerCase();
      return role.includes("admin");
    }).length;

    const targetTypes = new Set(
      logs.map((log) => log?.targetType).filter(Boolean),
    ).size;

    return {
      auditLogs: auditTotal,
      adminActions,
      targetTypes,
      blockedUsers: blockedTotal,
    };
  }, [auditTotal, blockedTotal, logs]);

  const latestLogs = useMemo(() => logs.slice(0, 5), [logs]);
  const latestBlocks = useMemo(() => blockedUsers.slice(0, 4), [blockedUsers]);

  const loadLogs = async (pageToLoad = auditPage) => {
    try {
      setLoadingLogs(true);
      setAuditError("");

      const data = await adminService.getAuditLogs({
        page: pageToLoad,
        limit: AUDIT_LIMIT,
        search: auditSearch,
      });

      setLogs(Array.isArray(data?.items) ? data.items : []);
      setAuditPagination(data?.pagination || null);
      setAuditPage(pageToLoad);
    } catch (error) {
      const message = getApiErrorMessage(error);

      setAuditError(message);
      setLogs([]);
      setAuditPagination(null);

      toast.error(message);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadBlockedUsers = async (pageToLoad = blockedPage) => {
    try {
      setLoadingBlockedUsers(true);

      const data = await publicChatService.getBlockedUsers({
        page: pageToLoad,
        limit: BLOCK_LIMIT,
      });

      setBlockedUsers(Array.isArray(data?.items) ? data.items : []);
      setBlockedPagination(data?.pagination || null);
      setBlockedPage(pageToLoad);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setBlockedUsers([]);
      setBlockedPagination(null);
    } finally {
      setLoadingBlockedUsers(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
    loadBlockedUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuditSearch = async (event) => {
    event.preventDefault();
    await loadLogs(1);
  };

  const handleRefresh = async () => {
    if (activeTab === "audit") {
      await loadLogs(auditPage);
      return;
    }

    if (activeTab === "blockedChat") {
      await loadBlockedUsers(blockedPage);
      toast.success("Blocked users refreshed.");
      return;
    }

    await Promise.all([loadLogs(auditPage), loadBlockedUsers(blockedPage)]);
    toast.success("System control refreshed.");
  };

  const handleUnblockUser = async (block) => {
    const targetUser = block?.userId;

    if (!targetUser?._id) return;

    const shouldUnblock = window.confirm(
      `Unblock ${targetUser.fullName || "this user"} from public chat?`,
    );

    if (!shouldUnblock) return;

    try {
      setUnblockingUserId(targetUser._id);

      await publicChatService.unblockUser(targetUser._id);
      toast.success("User unblocked from public chat.");

      await loadBlockedUsers(blockedPage);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUnblockingUserId("");
    }
  };

  const auditCurrentPage = Number(
    auditPagination?.currentPage || auditPage || 1,
  );
  const auditTotalPages = Number(auditPagination?.totalPages || 1);

  const blockCurrentPage = Number(
    blockedPagination?.currentPage || blockedPage || 1,
  );
  const blockTotalPages = Number(blockedPagination?.totalPages || 1);

  return (
    <section className="admin-crud asc2-page">
      <section className="asc2-hero">
        <div>
          <span className="adm-eyebrow">
            <ShieldAlert size={15} />
            System control
          </span>

          <h2>Review system activity and moderate public chat safely.</h2>

          <div className="asc2-hero-actions">
            <button
              type="button"
              className="adm-primary-btn"
              onClick={() => setActiveTab("audit")}
            >
              <FileSearch size={16} />
              Audit Logs
            </button>

            <button
              type="button"
              className="adm-secondary-btn"
              onClick={() => setActiveTab("blockedChat")}
            >
              Chat Blocks
            </button>
          </div>
        </div>

        <div className="asc2-hero-mini-grid">
          <div>
            <span>Audit logs</span>
            <strong>{loadingLogs ? "..." : stats.auditLogs}</strong>
          </div>

          <div>
            <span>Admin actions</span>
            <strong>{loadingLogs ? "..." : stats.adminActions}</strong>
          </div>

          <div>
            <span>Blocked users</span>
            <strong>{loadingBlockedUsers ? "..." : stats.blockedUsers}</strong>
          </div>
        </div>
      </section>

      <div className="adm-tabs" role="tablist" aria-label="System sections">
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

        <button
          type="button"
          className="asc2-refresh-tab"
          onClick={handleRefresh}
          disabled={loadingLogs || loadingBlockedUsers}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="asc2-tab-panel">
          <div className="asc2-metric-grid">
            <MetricCard
              icon={FileSearch}
              label="Audit Logs"
              value={stats.auditLogs}
              helper="Current page"
              tone="green"
            />

            <MetricCard
              icon={ShieldCheck}
              label="Admin Actions"
              value={stats.adminActions}
              helper="Detected logs"
              tone="purple"
            />

            <MetricCard
              icon={Filter}
              label="Target Types"
              value={stats.targetTypes}
              helper="Log variety"
              tone="amber"
            />

            <MetricCard
              icon={Ban}
              label="Chat Blocks"
              value={stats.blockedUsers}
              helper="Active restrictions"
              tone="rose"
            />
          </div>

          <div className="asc2-overview-grid">
            <section className="asc2-panel-card">
              <div className="asc2-panel-header">
                <div>
                  <h3>Latest audit logs</h3>
                  <span>Recent sensitive actions</span>
                </div>

                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={() => setActiveTab("audit")}
                >
                  Open Logs
                </button>
              </div>

              {loadingLogs ? (
                <div className="asc2-empty-box">Loading audit logs...</div>
              ) : auditError ? (
                <div className="asc2-empty-box">{auditError}</div>
              ) : latestLogs.length ? (
                <div className="asc2-compact-list">
                  {latestLogs.map((log, index) => (
                    <article
                      key={log?._id || `${log?.action}-${index}`}
                      className="asc2-compact-row"
                    >
                      <div className="asc2-compact-icon">
                        <Activity size={16} />
                      </div>

                      <div>
                        <h4>{log?.action || "System action"}</h4>
                        <p>
                          {getActorName(log)} • {formatDateTime(log?.createdAt)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="asc2-empty-box">No audit logs found.</div>
              )}
            </section>

            <section className="asc2-panel-card">
              <div className="asc2-panel-header">
                <div>
                  <h3>Current chat blocks</h3>
                  <span>Users restricted from public chat</span>
                </div>

                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={() => setActiveTab("blockedChat")}
                >
                  Open Blocks
                </button>
              </div>

              {loadingBlockedUsers ? (
                <div className="asc2-empty-box">Loading blocked users...</div>
              ) : latestBlocks.length ? (
                <div className="asc2-compact-list">
                  {latestBlocks.map((block) => (
                    <article key={block?._id} className="asc2-compact-row">
                      <div className="asc2-compact-icon asc2-compact-icon--danger">
                        <Ban size={16} />
                      </div>

                      <div>
                        <h4>{block?.userId?.fullName || "Blocked user"}</h4>
                        <p>
                          {block?.reason || "No reason"} •{" "}
                          {formatDateTime(block?.createdAt)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="asc2-empty-box">
                  No blocked chat users right now.
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="asc2-tab-panel">
          <section className="asc2-panel-card">
            <div className="asc2-panel-header">
              <div>
                <h3>Audit logs</h3>
                <span>{auditTotal} audit event(s)</span>
              </div>
            </div>

            <form className="asc2-filter-bar" onSubmit={handleAuditSearch}>
              <label className="asc2-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search action, actor, role, target, reason"
                  value={auditSearch}
                  onChange={(event) => setAuditSearch(event.target.value)}
                />
              </label>

              <button
                type="submit"
                className="adm-secondary-btn"
                disabled={loadingLogs}
              >
                Search
              </button>
            </form>

            {loadingLogs ? (
              <div className="asc2-empty-box asc2-empty-box--large">
                Loading audit logs...
              </div>
            ) : auditError ? (
              <div className="asc2-empty-box asc2-empty-box--large">
                {auditError}
              </div>
            ) : logs.length ? (
              <div className="asc2-audit-list">
                {logs.map((log, index) => (
                  <AuditLogCard
                    key={log?._id || `${log?.action}-${index}`}
                    log={log}
                  />
                ))}
              </div>
            ) : (
              <div className="asc2-empty-box asc2-empty-box--large">
                No audit log entries found.
              </div>
            )}

            {auditPagination && auditTotalPages > 1 ? (
              <div className="asc2-pagination">
                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={() => loadLogs(Math.max(auditCurrentPage - 1, 1))}
                  disabled={!auditPagination.hasPrevPage || loadingLogs}
                >
                  Previous
                </button>

                <span>
                  Page {auditCurrentPage} of {auditTotalPages}
                </span>

                <button
                  type="button"
                  className="adm-primary-btn"
                  onClick={() =>
                    loadLogs(Math.min(auditCurrentPage + 1, auditTotalPages))
                  }
                  disabled={!auditPagination.hasNextPage || loadingLogs}
                >
                  Next
                </button>
              </div>
            ) : null}
          </section>
        </div>
      )}

      {activeTab === "blockedChat" && (
        <div className="asc2-tab-panel">
          <section className="asc2-panel-card">
            <div className="asc2-panel-header">
              <div>
                <h3>Blocked public chat users</h3>
                <span>{blockedTotal} active block(s)</span>
              </div>

              <button
                type="button"
                className="adm-secondary-btn"
                onClick={() => loadBlockedUsers(blockedPage)}
                disabled={loadingBlockedUsers}
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>

            {loadingBlockedUsers ? (
              <div className="asc2-empty-box asc2-empty-box--large">
                Loading blocked users...
              </div>
            ) : blockedUsers.length ? (
              <div className="asc2-block-grid">
                {blockedUsers.map((block) => (
                  <BlockedUserCard
                    key={block?._id}
                    block={block}
                    unblockingUserId={unblockingUserId}
                    onUnblock={handleUnblockUser}
                  />
                ))}
              </div>
            ) : (
              <div className="asc2-empty-state">
                <UserRoundX size={34} />
                <h3>No blocked users</h3>
                <p>
                  Public chat is open for all users. Blocked users will appear
                  here after admin moderation.
                </p>
              </div>
            )}

            {blockedPagination && blockTotalPages > 1 ? (
              <div className="asc2-pagination">
                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={() =>
                    loadBlockedUsers(Math.max(blockCurrentPage - 1, 1))
                  }
                  disabled={
                    !blockedPagination.hasPrevPage || loadingBlockedUsers
                  }
                >
                  Previous
                </button>

                <span>
                  Page {blockCurrentPage} of {blockTotalPages}
                </span>

                <button
                  type="button"
                  className="adm-primary-btn"
                  onClick={() =>
                    loadBlockedUsers(
                      Math.min(blockCurrentPage + 1, blockTotalPages),
                    )
                  }
                  disabled={
                    !blockedPagination.hasNextPage || loadingBlockedUsers
                  }
                >
                  Next
                </button>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </section>
  );
}
