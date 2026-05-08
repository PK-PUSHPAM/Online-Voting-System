import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  Clock3,
  Filter,
  Globe2,
  LayoutGrid,
  ListChecks,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  TimerReset,
  Trophy,
  Vote,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import { electionService } from "../../services/election.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";
import "../../styles/admin-light-theme.css";

const PAGE_LIMIT = 10;

const initialForm = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  isPublished: false,
  allowedVoterType: "verifiedOnly",
};

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "create", label: "Create", icon: PlusCircle },
  { id: "manage", label: "Manage", icon: ListChecks },
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

function formatStatus(value = "upcoming") {
  return String(value || "upcoming")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "active") return "aep-status aep-status--active";
  if (value === "ended") return "aep-status aep-status--ended";
  return "aep-status aep-status--upcoming";
}

function getPublishClass(isPublished) {
  return isPublished
    ? "aep-status aep-status--published"
    : "aep-status aep-status--draft";
}

function getAccessLabel(value) {
  return value === "all" ? "All voters" : "Verified only";
}

function ElectionCard({ election }) {
  return (
    <article className="aep-election-card">
      <div className="aep-election-card__top">
        <div>
          <h4>{election?.title || "Untitled election"}</h4>
          <p>{election?.description || "No description added."}</p>
        </div>

        <span className={getStatusClass(election?.status)}>
          {formatStatus(election?.status)}
        </span>
      </div>

      <div className="aep-election-card__meta">
        <div>
          <CalendarRange size={15} />
          <span>Start</span>
          <strong>{formatDateTime(election?.startDate)}</strong>
        </div>

        <div>
          <Clock3 size={15} />
          <span>End</span>
          <strong>{formatDateTime(election?.endDate)}</strong>
        </div>

        <div>
          <Globe2 size={15} />
          <span>Access</span>
          <strong>{getAccessLabel(election?.allowedVoterType)}</strong>
        </div>
      </div>

      <div className="aep-election-card__footer">
        <div className="aep-election-card__chips">
          <span className={getPublishClass(election?.isPublished)}>
            {election?.isPublished ? "Published" : "Draft"}
          </span>

          <span className="aep-id-chip">
            <CheckCircle2 size={13} />
            ID: {String(election?._id || "").slice(-6)}
          </span>
        </div>
      </div>
    </article>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone = "green" }) {
  return (
    <article className={`aep-metric-card aep-metric-card--${tone}`}>
      <div className="aep-metric-card__icon">
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

export default function ElectionsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [form, setForm] = useState(initialForm);

  const [elections, setElections] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const totalCount = Number(pagination?.totalItems || elections.length || 0);

  const stats = useMemo(() => {
    return elections.reduce(
      (acc, election) => {
        if (election?.isPublished) acc.published += 1;
        if (!election?.isPublished) acc.draft += 1;
        if (election?.status === "upcoming") acc.upcoming += 1;
        if (election?.status === "active") acc.active += 1;
        if (election?.status === "ended") acc.ended += 1;
        if (election?.allowedVoterType === "verifiedOnly")
          acc.verifiedOnly += 1;
        return acc;
      },
      {
        published: 0,
        draft: 0,
        upcoming: 0,
        active: 0,
        ended: 0,
        verifiedOnly: 0,
      },
    );
  }, [elections]);

  const loadElections = async (pageToLoad = page) => {
    try {
      setLoading(true);

      const data = await electionService.getAll({
        page: pageToLoad,
        limit: PAGE_LIMIT,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });

      setElections(Array.isArray(data?.items) ? data.items : []);
      setPagination(data?.pagination || null);
      setPage(pageToLoad);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setElections([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadElections(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      toast.error("Election title is required.");
      return false;
    }

    if (!form.startDate || !form.endDate) {
      toast.error("Start and end date are required.");
      return false;
    }

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error("Please enter valid dates.");
      return false;
    }

    if (start >= end) {
      toast.error("End date must be later than start date.");
      return false;
    }

    return true;
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setCreateLoading(true);

      await electionService.create({
        title: form.title.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        isPublished: form.isPublished,
        allowedVoterType: form.allowedVoterType,
      });

      toast.success("Election created successfully.");
      setForm(initialForm);
      setActiveTab("manage");
      await loadElections(1);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    await loadElections(1);
  };

  const handleRefresh = async () => {
    await loadElections(page);
    toast.success("Election list refreshed.");
  };

  const hasPrevPage = Boolean(pagination?.hasPrevPage);
  const hasNextPage = Boolean(pagination?.hasNextPage);
  const currentPage = Number(pagination?.currentPage || page || 1);
  const totalPages = Number(pagination?.totalPages || 1);

  return (
    <section className="admin-crud aep-page">
      <section className="aep-hero">
        <div>
          <span className="adm-eyebrow">
            <Vote size={15} />
            Election control
          </span>

          <h2>Manage elections with a cleaner workflow.</h2>

          <div className="aep-hero-actions">
            <button
              type="button"
              className="adm-primary-btn"
              onClick={() => setActiveTab("create")}
            >
              <PlusCircle size={16} />
              Create Election
            </button>

            <button
              type="button"
              className="adm-secondary-btn"
              onClick={() => setActiveTab("manage")}
            >
              Manage List
            </button>
          </div>
        </div>

        <div className="aep-hero-mini-grid">
          <div>
            <span>Total</span>
            <strong>{loading ? "..." : totalCount}</strong>
          </div>

          <div>
            <span>Active</span>
            <strong>{loading ? "..." : stats.active}</strong>
          </div>

          <div>
            <span>Published</span>
            <strong>{loading ? "..." : stats.published}</strong>
          </div>
        </div>
      </section>

      <div className="adm-tabs" role="tablist" aria-label="Election sections">
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
        <div className="aep-tab-panel">
          <div className="aep-metric-grid">
            <MetricCard
              icon={TimerReset}
              label="Upcoming"
              value={stats.upcoming}
              helper="Scheduled elections"
              tone="amber"
            />

            <MetricCard
              icon={Vote}
              label="Active"
              value={stats.active}
              helper="Voting open now"
              tone="green"
            />

            <MetricCard
              icon={Trophy}
              label="Ended"
              value={stats.ended}
              helper="Completed elections"
              tone="purple"
            />

            <MetricCard
              icon={ShieldCheck}
              label="Verified access"
              value={stats.verifiedOnly}
              helper="Restricted elections"
              tone="rose"
            />
          </div>

          <section className="aep-panel-card">
            <div className="aep-panel-header">
              <div>
                <h3>Latest elections</h3>
                <span>Quick preview from current page</span>
              </div>

              <button
                type="button"
                className="adm-secondary-btn"
                onClick={() => setActiveTab("manage")}
              >
                Open Manage
              </button>
            </div>

            {loading ? (
              <div className="aep-empty-box">Loading elections...</div>
            ) : elections.length ? (
              <div className="aep-compact-list">
                {elections.slice(0, 5).map((election) => (
                  <article key={election._id} className="aep-compact-row">
                    <div className="aep-compact-row__icon">
                      <Vote size={16} />
                    </div>

                    <div>
                      <h4>{election?.title || "Election"}</h4>
                      <p>
                        {formatStatus(election?.status)} •{" "}
                        {election?.isPublished ? "Published" : "Draft"} •{" "}
                        {getAccessLabel(election?.allowedVoterType)}
                      </p>
                    </div>

                    <span className={getStatusClass(election?.status)}>
                      {formatStatus(election?.status)}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="aep-empty-box">No elections found.</div>
            )}
          </section>
        </div>
      )}

      {activeTab === "create" && (
        <div className="aep-tab-panel">
          <section className="aep-panel-card">
            <div className="aep-panel-header">
              <div>
                <h3>Create election</h3>
                <span>Set title, schedule, access, and publish state</span>
              </div>

              <span className="aep-panel-badge">New</span>
            </div>

            <form className="aep-form" onSubmit={handleCreate}>
              <div className="aep-form-grid">
                <InputField
                  label="Election Title"
                  name="title"
                  placeholder="Student Council Election 2026"
                  value={form.title}
                  onChange={handleChange}
                />

                <div className="form-field">
                  <label className="form-label">Allowed Voter Type</label>
                  <select
                    name="allowedVoterType"
                    value={form.allowedVoterType}
                    onChange={handleChange}
                    className="admin-crud__select"
                  >
                    <option value="verifiedOnly">Verified Only</option>
                    <option value="all">All Voters</option>
                  </select>
                </div>

                <InputField
                  label="Start Date & Time"
                  name="startDate"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={handleChange}
                />

                <InputField
                  label="End Date & Time"
                  name="endDate"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={handleChange}
                />

                <div className="form-field aep-form-grid__full">
                  <label className="form-label">Description</label>
                  <textarea
                    className="admin-crud__textarea"
                    name="description"
                    placeholder="Short election purpose or scope"
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>

                <label className="aep-switch-card aep-form-grid__full">
                  <div>
                    <strong>Publish immediately</strong>
                    <span>
                      Turn this on only when posts/candidates setup is ready.
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={form.isPublished}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div className="aep-form-actions">
                <Button
                  className="admin-crud__submit"
                  type="submit"
                  loading={createLoading}
                >
                  Create Election
                </Button>

                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={() => setForm(initialForm)}
                  disabled={createLoading}
                >
                  Reset
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {activeTab === "manage" && (
        <div className="aep-tab-panel">
          <section className="aep-panel-card">
            <div className="aep-panel-header">
              <div>
                <h3>Manage elections</h3>
                <span>{totalCount} election(s)</span>
              </div>

              <button
                type="button"
                className="adm-secondary-btn"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>

            <form className="aep-filter-bar" onSubmit={handleFilterSubmit}>
              <label className="aep-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search election title"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <label className="aep-filter-select">
                <Filter size={16} />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">All status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="ended">Ended</option>
                </select>
              </label>

              <Button type="submit" variant="secondary" loading={loading}>
                Apply
              </Button>
            </form>

            {loading ? (
              <div className="aep-empty-box aep-empty-box--large">
                Loading elections...
              </div>
            ) : elections.length ? (
              <div className="aep-election-grid">
                {elections.map((election) => (
                  <ElectionCard key={election._id} election={election} />
                ))}
              </div>
            ) : (
              <div className="aep-empty-box aep-empty-box--large">
                No elections found for current filters.
              </div>
            )}

            {pagination && totalPages > 1 ? (
              <div className="aep-pagination">
                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={() => loadElections(Math.max(currentPage - 1, 1))}
                  disabled={!hasPrevPage || loading}
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  className="adm-primary-btn"
                  onClick={() =>
                    loadElections(Math.min(currentPage + 1, totalPages))
                  }
                  disabled={!hasNextPage || loading}
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
