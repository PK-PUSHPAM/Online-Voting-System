import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Ban,
  Clock3,
  MessageCircle,
  RefreshCw,
  Shield,
  ShieldCheck,
  Unlock,
  UserRoundX,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services/admin.service";
import { publicChatService } from "../../services/publicChat.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";

const tabs = [
  { id: "audit", label: "Audit Logs", icon: Activity },
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

export default function SystemControlPage() {
  const [activeTab, setActiveTab] = useState("audit");

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [search, setSearch] = useState("");

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedPagination, setBlockedPagination] = useState(null);
  const [blockedPage, setBlockedPage] = useState(1);
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false);
  const [unblockingUserId, setUnblockingUserId] = useState("");

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return logs;

    return logs.filter((log) => {
      return (
        String(log?.action || "")
          .toLowerCase()
          .includes(keyword) ||
        String(log?.description || "")
          .toLowerCase()
          .includes(keyword) ||
        String(log?.performedBy?.fullName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(log?.performedBy?.role || "")
          .toLowerCase()
          .includes(keyword) ||
        String(log?.actorId?.fullName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(log?.actorRole || "")
          .toLowerCase()
          .includes(keyword) ||
        String(log?.targetType || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [logs, search]);

  const totalLogs = logs.length;
  const visibleLogs = filteredLogs.length;

  const adminActions = useMemo(() => {
    return logs.filter((log) => {
      const role = String(
        log?.performedBy?.role || log?.actorRole || "",
      ).toLowerCase();

      return role.includes("admin");
    }).length;
  }, [logs]);

  const targetTypes = useMemo(() => {
    return new Set(logs.map((log) => log?.targetType).filter(Boolean)).size;
  }, [logs]);

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);

      const data = await adminService.getAuditLogs({
        page: 1,
        limit: 50,
      });

      setLogs(
        Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [],
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadBlockedUsers = async (page = blockedPage) => {
    try {
      setLoadingBlockedUsers(true);

      const data = await publicChatService.getBlockedUsers({
        page,
        limit: 10,
      });

      setBlockedUsers(Array.isArray(data?.items) ? data.items : []);
      setBlockedPagination(data?.pagination || null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setBlockedUsers([]);
      setBlockedPagination(null);
    } finally {
      setLoadingBlockedUsers(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (activeTab === "blockedChat") {
      loadBlockedUsers(blockedPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, blockedPage]);

  const handleRefresh = async () => {
    if (activeTab === "audit") {
      await loadLogs();
      toast.success("Audit logs refreshed.");
      return;
    }

    await loadBlockedUsers(blockedPage);
    toast.success("Blocked chat users refreshed.");
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

  return (
    <section className="admin-crud">
      <div className="admin-crud__hero">
        <div className="admin-crud__hero-copy">
          <span className="admin-crud__eyebrow">
            <Shield size={14} />
            System control
          </span>

          <h2>
            Review audit activity and moderate public chat behavior across the
            platform.
          </h2>

          <p>
            Audit visibility and chat moderation are essential for
            accountability. Use this page to inspect sensitive actions and
            unblock users when moderation restrictions are no longer needed.
          </p>
        </div>

        <div className="admin-crud__hero-grid">
          <div className="admin-crud__hero-stat">
            <span>Total audit logs</span>
            <strong>{totalLogs}</strong>
          </div>

          <div className="admin-crud__hero-stat">
            <span>Visible after search</span>
            <strong>{visibleLogs}</strong>
          </div>

          <div className="admin-crud__hero-stat">
            <span>Admin actions</span>
            <strong>{adminActions}</strong>
          </div>

          <div className="admin-crud__hero-stat">
            <span>Blocked chat users</span>
            <strong>
              {blockedPagination?.totalItems ?? blockedUsers.length ?? 0}
            </strong>
          </div>
        </div>
      </div>

      <div className="asc-tabs" role="tablist" aria-label="System control tabs">
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
          className="asc-tabs__refresh"
          onClick={handleRefresh}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {activeTab === "audit" && (
        <div className="admin-crud__panel">
          <div className="admin-crud__toolbar">
            <div className="admin-crud__toolbar-left">
              <h3 style={{ margin: 0 }}>Audit logs</h3>
              <span className="admin-crud__meta">{visibleLogs} item(s)</span>
            </div>

            <div className="admin-crud__toolbar-right">
              <input
                type="text"
                className="form-input admin-crud__search"
                placeholder="Search by action, description, role, or target"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {loadingLogs ? (
            <div className="admin-crud__empty">
              <p>Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="admin-crud__empty">
              <p>No audit log entries match the current search.</p>
            </div>
          ) : (
            <div className="admin-election-list">
              {filteredLogs.map((log, index) => (
                <article
                  key={log._id || `${log.action}-${index}`}
                  className="admin-election-list__item"
                >
                  <div className="admin-election-list__rank">
                    <Activity size={18} />
                  </div>

                  <div className="admin-election-list__content">
                    <div className="admin-election-list__top">
                      <h4>{log?.action || "Administrative action"}</h4>
                      <span className="admin-election-list__votes">
                        {formatDateTime(log?.createdAt)}
                      </span>
                    </div>

                    <div className="admin-election-list__meta">
                      <span className="admin-crud__chip">
                        <ShieldCheck size={14} />
                        {log?.performedBy?.fullName ||
                          log?.actorId?.fullName ||
                          "System"}
                      </span>

                      <span className="admin-crud__chip">
                        <Shield size={14} />
                        {log?.performedBy?.role || log?.actorRole || "system"}
                      </span>

                      {log?.targetType ? (
                        <span className="admin-crud__chip">
                          {log.targetType}
                        </span>
                      ) : null}

                      {log?.targetId ? (
                        <span className="admin-crud__chip">
                          ID: {String(log.targetId).slice(-8)}
                        </span>
                      ) : null}
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <p
                        className="admin-crud__inline-note"
                        style={{ margin: 0 }}
                      >
                        {log?.description ||
                          "No description is available for this audit event."}
                      </p>
                    </div>

                    <div
                      className="admin-crud__chips"
                      style={{ marginTop: 12 }}
                    >
                      <span className="admin-crud__chip">
                        <Clock3 size={14} />
                        Recorded event
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "blockedChat" && (
        <div className="admin-crud__panel">
          <div className="admin-crud__toolbar">
            <div className="admin-crud__toolbar-left">
              <h3 style={{ margin: 0 }}>Blocked public chat users</h3>
              <span className="admin-crud__meta">
                {blockedPagination?.totalItems ?? blockedUsers.length} blocked
              </span>
            </div>

            <div className="admin-crud__toolbar-right">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => loadBlockedUsers(blockedPage)}
                disabled={loadingBlockedUsers}
              >
                <RefreshCw size={15} />
                {loadingBlockedUsers ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {loadingBlockedUsers ? (
            <div className="admin-crud__empty">
              <p>Loading blocked users...</p>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="asc-empty-state">
              <UserRoundX size={34} />
              <h3>No blocked users</h3>
              <p>
                Public chat is currently open for all users. Blocked users will
                appear here after admin moderation.
              </p>
            </div>
          ) : (
            <div className="asc-blocked-grid">
              {blockedUsers.map((block) => {
                const blockedUser = block?.userId || {};
                const blockedBy = block?.blockedBy || {};
                const initials = getInitials(blockedUser?.fullName || "User");

                return (
                  <article key={block._id} className="asc-blocked-card">
                    <div className="asc-blocked-card__top">
                      <div className="asc-blocked-card__avatar">
                        {blockedUser?.profilePhotoUrl ? (
                          <img
                            src={blockedUser.profilePhotoUrl}
                            alt={blockedUser.fullName || "Blocked user"}
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>

                      <div>
                        <h4>{blockedUser?.fullName || "Blocked user"}</h4>
                        <p>{blockedUser?.email || "No email available"}</p>
                      </div>

                      <span className="asc-blocked-card__badge">
                        <Ban size={13} />
                        Blocked
                      </span>
                    </div>

                    <div className="asc-blocked-card__meta">
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

                    <div className="asc-blocked-card__reason">
                      <MessageCircle size={15} />
                      <div>
                        <strong>Reason</strong>
                        <p>
                          {block?.reason ||
                            "No reason was provided by the administrator."}
                        </p>
                      </div>
                    </div>

                    <div className="asc-blocked-card__actions">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleUnblockUser(block)}
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
              })}
            </div>
          )}

          {blockedPagination && blockedPagination.totalPages > 1 ? (
            <div className="asc-pagination">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setBlockedPage((page) => Math.max(page - 1, 1))}
                disabled={!blockedPagination.hasPrevPage}
              >
                Previous
              </button>

              <span>
                Page {blockedPagination.currentPage} of{" "}
                {blockedPagination.totalPages}
              </span>

              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  setBlockedPage((page) =>
                    Math.min(page + 1, blockedPagination.totalPages),
                  )
                }
                disabled={!blockedPagination.hasNextPage}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
