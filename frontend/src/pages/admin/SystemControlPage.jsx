import { useEffect, useMemo, useState } from "react";
import { Activity, Clock3, Shield, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import { adminService } from "../../services/admin.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";

export default function SystemControlPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
        String(log?.targetType || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [logs, search]);

  const totalLogs = logs.length;
  const visibleLogs = filteredLogs.length;
  const adminActions = useMemo(
    () =>
      logs.filter((log) =>
        String(log?.performedBy?.role || "")
          .toLowerCase()
          .includes("admin"),
      ).length,
    [logs],
  );
  const targetTypes = useMemo(() => {
    return new Set(logs.map((log) => log?.targetType).filter(Boolean)).size;
  }, [logs]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAuditLogs();
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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <section className="admin-crud">
      <div className="admin-crud__hero">
        <div className="admin-crud__hero-copy">
          <span className="admin-crud__eyebrow">
            <Shield size={14} />
            System control
          </span>

          <h2>
            Review audit activity and monitor sensitive administrative actions
            across the platform.
          </h2>

          <p>
            Audit visibility is essential for accountability. Use this page to
            review recorded system actions, identify who performed them, and
            understand which platform resources were affected.
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
            <span>Target types</span>
            <strong>{targetTypes}</strong>
          </div>
        </div>
      </div>

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

        {loading ? (
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
                      {log?.createdAt
                        ? new Date(log.createdAt).toLocaleString()
                        : "-"}
                    </span>
                  </div>

                  <div className="admin-election-list__meta">
                    <span className="admin-crud__chip">
                      <ShieldCheck size={14} />
                      {log?.performedBy?.fullName || "System"}
                    </span>

                    <span className="admin-crud__chip">
                      <Shield size={14} />
                      {log?.performedBy?.role || "system"}
                    </span>

                    {log?.targetType ? (
                      <span className="admin-crud__chip">{log.targetType}</span>
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

                  <div className="admin-crud__chips" style={{ marginTop: 12 }}>
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
    </section>
  );
}
