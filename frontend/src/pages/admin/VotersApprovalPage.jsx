import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Filter,
  LayoutGrid,
  ListChecks,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../../components/common/Button";
import { userService } from "../../services/user.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";
import "../../styles/admin-light-theme.css";

const PAGE_LIMIT = 10;

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "pending", label: "Pending Queue", icon: ListChecks },
  { id: "all", label: "All Voters", icon: Users },
];

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return "-";
  }
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

function formatStatus(value = "pending") {
  return String(value || "pending")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
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

function VerificationPill({ status = "pending" }) {
  const normalizedStatus = String(status || "pending").toLowerCase();

  return (
    <span className={`avp-status avp-status--${normalizedStatus}`}>
      {formatStatus(normalizedStatus)}
    </span>
  );
}

function BooleanPill({ value, label }) {
  return (
    <span
      className={
        value ? "avp-chip avp-chip--success" : "avp-chip avp-chip--warning"
      }
    >
      {value ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {label}: {value ? "Yes" : "No"}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone = "green" }) {
  return (
    <article className={`avp-metric-card avp-metric-card--${tone}`}>
      <div className="avp-metric-card__icon">
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

function VoterCard({
  voter,
  mode = "pending",
  rowActionId,
  onApprove,
  onReject,
}) {
  const isBusy = rowActionId === voter?._id;
  const verificationStatus = String(voter?.verificationStatus || "pending");

  return (
    <article className="avp-voter-card">
      <div className="avp-voter-card__top">
        <div className="avp-voter-avatar">
          {voter?.profilePhotoUrl ? (
            <img src={voter.profilePhotoUrl} alt={voter.fullName || "Voter"} />
          ) : (
            <span>{getInitials(voter?.fullName || "Voter")}</span>
          )}
        </div>

        <div className="avp-voter-title">
          <h4>{voter?.fullName || "Unnamed voter"}</h4>
          <p>{voter?.email || "No email available"}</p>
        </div>

        <VerificationPill status={verificationStatus} />
      </div>

      <div className="avp-voter-meta">
        <div>
          <Users size={15} />
          <span>Voter ID</span>
          <strong>{voter?.internalVoterId || "Not assigned"}</strong>
        </div>

        <div>
          <Clock3 size={15} />
          <span>DOB</span>
          <strong>{formatDate(voter?.dob)}</strong>
        </div>

        <div>
          <ShieldCheck size={15} />
          <span>Identity</span>
          <strong>
            {voter?.identityType || "other"}
            {voter?.identityLast4 ? ` • ${voter.identityLast4}` : ""}
          </strong>
        </div>

        <div>
          <Clock3 size={15} />
          <span>Created</span>
          <strong>{formatDateTime(voter?.createdAt)}</strong>
        </div>
      </div>

      <div className="avp-chip-row">
        <BooleanPill value={voter?.mobileVerified} label="Mobile" />
        <BooleanPill value={voter?.ageVerified} label="Age" />
        <BooleanPill value={voter?.isEligibleToVote} label="Eligible" />

        <span className="avp-chip">Mobile: {voter?.mobileNumber || "N/A"}</span>
      </div>

      {voter?.documentUrl ? (
        <div className="avp-document-box">
          <ShieldAlert size={16} />
          <div>
            <strong>Verification document available</strong>
            <a href={voter.documentUrl} target="_blank" rel="noreferrer">
              Open document
            </a>
          </div>
        </div>
      ) : null}

      {voter?.verificationRejectionReason ? (
        <div className="avp-rejection-box">
          <strong>Rejection reason</strong>
          <p>{voter.verificationRejectionReason}</p>
        </div>
      ) : null}

      {mode === "pending" ? (
        <div className="avp-voter-actions">
          <button
            type="button"
            className="adm-primary-btn"
            onClick={() => onApprove(voter)}
            disabled={isBusy}
          >
            <BadgeCheck size={15} />
            {isBusy ? "Processing..." : "Approve"}
          </button>

          <button
            type="button"
            className="avp-danger-btn"
            onClick={() => onReject(voter)}
            disabled={isBusy}
          >
            <XCircle size={15} />
            Reject
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function VotersApprovalPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const [pendingVoters, setPendingVoters] = useState([]);
  const [pendingPagination, setPendingPagination] = useState(null);
  const [pendingPage, setPendingPage] = useState(1);

  const [allVoters, setAllVoters] = useState([]);
  const [allPagination, setAllPagination] = useState(null);
  const [allPage, setAllPage] = useState(1);

  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [rowActionId, setRowActionId] = useState("");

  const [pendingSearch, setPendingSearch] = useState("");
  const [allSearch, setAllSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const pendingTotal = Number(
    pendingPagination?.totalItems || pendingVoters.length || 0,
  );

  const allTotal = Number(allPagination?.totalItems || allVoters.length || 0);

  const pendingStats = useMemo(() => {
    return pendingVoters.reduce(
      (acc, voter) => {
        if (voter?.mobileVerified) acc.mobileVerified += 1;
        if (voter?.ageVerified) acc.ageVerified += 1;
        if (voter?.isEligibleToVote) acc.eligible += 1;
        if (voter?.documentUrl) acc.withDocument += 1;
        return acc;
      },
      {
        mobileVerified: 0,
        ageVerified: 0,
        eligible: 0,
        withDocument: 0,
      },
    );
  }, [pendingVoters]);

  const allStats = useMemo(() => {
    return allVoters.reduce(
      (acc, voter) => {
        const status = String(voter?.verificationStatus || "pending");

        if (status === "approved") acc.approved += 1;
        else if (status === "rejected") acc.rejected += 1;
        else acc.pending += 1;

        if (voter?.isActive !== false) acc.active += 1;

        return acc;
      },
      {
        approved: 0,
        rejected: 0,
        pending: 0,
        active: 0,
      },
    );
  }, [allVoters]);

  const latestPendingVoters = useMemo(
    () => pendingVoters.slice(0, 5),
    [pendingVoters],
  );

  const loadPendingVoters = async (pageToLoad = pendingPage) => {
    try {
      setLoadingPending(true);

      const data = await userService.getPendingVoters({
        page: pageToLoad,
        limit: PAGE_LIMIT,
        ...(pendingSearch.trim() ? { search: pendingSearch.trim() } : {}),
      });

      setPendingVoters(Array.isArray(data?.items) ? data.items : []);
      setPendingPagination(data?.pagination || null);
      setPendingPage(pageToLoad);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setPendingVoters([]);
      setPendingPagination(null);
    } finally {
      setLoadingPending(false);
    }
  };

  const loadAllVoters = async (pageToLoad = allPage) => {
    try {
      setLoadingAll(true);

      const data = await userService.getAllVoters({
        page: pageToLoad,
        limit: PAGE_LIMIT,
        ...(allSearch.trim() ? { search: allSearch.trim() } : {}),
        ...(statusFilter ? { verificationStatus: statusFilter } : {}),
      });

      setAllVoters(Array.isArray(data?.items) ? data.items : []);
      setAllPagination(data?.pagination || null);
      setAllPage(pageToLoad);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setAllVoters([]);
      setAllPagination(null);
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    loadPendingVoters(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "all") {
      loadAllVoters(allPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleApprove = async (voter) => {
    if (!voter?._id) return;

    try {
      setRowActionId(voter._id);

      await userService.approve(voter._id, {
        notes: "Approved from admin voter queue.",
      });

      toast.success("Voter approved successfully.");
      await loadPendingVoters(pendingPage);

      if (activeTab === "all") {
        await loadAllVoters(allPage);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRowActionId("");
    }
  };

  const handleReject = async (voter) => {
    if (!voter?._id) return;

    const reason = window.prompt(
      `Reason for rejecting ${voter.fullName || "this voter"}:`,
      "Verification information is incomplete",
    );

    if (reason === null) return;

    try {
      setRowActionId(voter._id);

      await userService.reject(voter._id, {
        reason: reason.trim() || "Verification rejected by administrator",
        notes: "Rejected from admin voter queue.",
      });

      toast.success("Voter rejected successfully.");
      await loadPendingVoters(pendingPage);

      if (activeTab === "all") {
        await loadAllVoters(allPage);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRowActionId("");
    }
  };

  const handlePendingSearch = async (event) => {
    event.preventDefault();
    await loadPendingVoters(1);
  };

  const handleAllSearch = async (event) => {
    event.preventDefault();
    await loadAllVoters(1);
  };

  const handleRefresh = async () => {
    if (activeTab === "all") {
      await loadAllVoters(allPage);
      toast.success("All voters refreshed.");
      return;
    }

    await loadPendingVoters(pendingPage);
    toast.success("Pending voters refreshed.");
  };

  const pendingCurrentPage = Number(
    pendingPagination?.currentPage || pendingPage || 1,
  );
  const pendingTotalPages = Number(pendingPagination?.totalPages || 1);

  const allCurrentPage = Number(allPagination?.currentPage || allPage || 1);
  const allTotalPages = Number(allPagination?.totalPages || 1);

  return (
    <section className="admin-crud avp-page">
      <section className="avp-hero">
        <div>
          <span className="adm-eyebrow">
            <Users size={15} />
            Voter verification
          </span>

          <h2>Approve voters with a cleaner verification workflow.</h2>

          <div className="avp-hero-actions">
            <button
              type="button"
              className="adm-primary-btn"
              onClick={() => setActiveTab("pending")}
            >
              <ListChecks size={16} />
              Pending Queue
            </button>

            <button
              type="button"
              className="adm-secondary-btn"
              onClick={() => setActiveTab("all")}
            >
              All Voters
            </button>
          </div>
        </div>

        <div className="avp-hero-mini-grid">
          <div>
            <span>Pending</span>
            <strong>{loadingPending ? "..." : pendingTotal}</strong>
          </div>

          <div>
            <span>Mobile verified</span>
            <strong>
              {loadingPending ? "..." : pendingStats.mobileVerified}
            </strong>
          </div>

          <div>
            <span>Documents</span>
            <strong>
              {loadingPending ? "..." : pendingStats.withDocument}
            </strong>
          </div>
        </div>
      </section>

      <div className="adm-tabs" role="tablist" aria-label="Voter sections">
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
          className="avp-refresh-tab"
          onClick={handleRefresh}
          disabled={loadingPending || loadingAll}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="avp-tab-panel">
          <div className="avp-metric-grid">
            <MetricCard
              icon={ListChecks}
              label="Pending"
              value={pendingTotal}
              helper="Awaiting approval"
              tone="amber"
            />

            <MetricCard
              icon={CheckCircle2}
              label="Mobile Verified"
              value={pendingStats.mobileVerified}
              helper="Pending queue"
              tone="green"
            />

            <MetricCard
              icon={ShieldCheck}
              label="Age Verified"
              value={pendingStats.ageVerified}
              helper="Pending queue"
              tone="purple"
            />

            <MetricCard
              icon={BadgeCheck}
              label="Eligible"
              value={pendingStats.eligible}
              helper="Current page"
              tone="rose"
            />
          </div>

          <section className="avp-panel-card">
            <div className="avp-panel-header">
              <div>
                <h3>Latest pending voters</h3>
                <span>Quick preview from current queue</span>
              </div>

              <button
                type="button"
                className="adm-secondary-btn"
                onClick={() => setActiveTab("pending")}
              >
                Open Queue
              </button>
            </div>

            {loadingPending ? (
              <div className="avp-empty-box">Loading voters...</div>
            ) : latestPendingVoters.length ? (
              <div className="avp-compact-list">
                {latestPendingVoters.map((voter) => (
                  <article key={voter._id} className="avp-compact-row">
                    <div className="avp-compact-avatar">
                      {voter?.profilePhotoUrl ? (
                        <img
                          src={voter.profilePhotoUrl}
                          alt={voter.fullName || "Voter"}
                        />
                      ) : (
                        <span>{getInitials(voter?.fullName || "Voter")}</span>
                      )}
                    </div>

                    <div>
                      <h4>{voter?.fullName || "Voter"}</h4>
                      <p>
                        {voter?.email || "No email"} •{" "}
                        {voter?.mobileVerified
                          ? "Mobile verified"
                          : "Mobile pending"}
                      </p>
                    </div>

                    <VerificationPill status={voter?.verificationStatus} />
                  </article>
                ))}
              </div>
            ) : (
              <div className="avp-empty-box">No pending voters found.</div>
            )}
          </section>
        </div>
      )}

      {activeTab === "pending" && (
        <div className="avp-tab-panel">
          <section className="avp-panel-card">
            <div className="avp-panel-header">
              <div>
                <h3>Pending queue</h3>
                <span>{pendingTotal} pending voter(s)</span>
              </div>
            </div>

            <form className="avp-filter-bar" onSubmit={handlePendingSearch}>
              <label className="avp-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by name, email, or mobile"
                  value={pendingSearch}
                  onChange={(event) => setPendingSearch(event.target.value)}
                />
              </label>

              <Button
                type="submit"
                variant="secondary"
                loading={loadingPending}
              >
                Search
              </Button>
            </form>

            {loadingPending ? (
              <div className="avp-empty-box avp-empty-box--large">
                Loading pending voters...
              </div>
            ) : pendingVoters.length ? (
              <div className="avp-voter-grid">
                {pendingVoters.map((voter) => (
                  <VoterCard
                    key={voter._id}
                    voter={voter}
                    mode="pending"
                    rowActionId={rowActionId}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            ) : (
              <div className="avp-empty-box avp-empty-box--large">
                No pending voters found.
              </div>
            )}

            {pendingPagination && pendingTotalPages > 1 ? (
              <div className="avp-pagination">
                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={() =>
                    loadPendingVoters(Math.max(pendingCurrentPage - 1, 1))
                  }
                  disabled={!pendingPagination.hasPrevPage || loadingPending}
                >
                  Previous
                </button>

                <span>
                  Page {pendingCurrentPage} of {pendingTotalPages}
                </span>

                <button
                  type="button"
                  className="adm-primary-btn"
                  onClick={() =>
                    loadPendingVoters(
                      Math.min(pendingCurrentPage + 1, pendingTotalPages),
                    )
                  }
                  disabled={!pendingPagination.hasNextPage || loadingPending}
                >
                  Next
                </button>
              </div>
            ) : null}
          </section>
        </div>
      )}

      {activeTab === "all" && (
        <div className="avp-tab-panel">
          <div className="avp-metric-grid">
            <MetricCard
              icon={UserCheck}
              label="Approved"
              value={allStats.approved}
              helper="Current page"
              tone="green"
            />

            <MetricCard
              icon={Filter}
              label="Pending"
              value={allStats.pending}
              helper="Current page"
              tone="amber"
            />

            <MetricCard
              icon={XCircle}
              label="Rejected"
              value={allStats.rejected}
              helper="Current page"
              tone="rose"
            />

            <MetricCard
              icon={ShieldCheck}
              label="Active"
              value={allStats.active}
              helper="Current page"
              tone="purple"
            />
          </div>

          <section className="avp-panel-card">
            <div className="avp-panel-header">
              <div>
                <h3>All voters</h3>
                <span>{allTotal} voter(s)</span>
              </div>
            </div>

            <form
              className="avp-filter-bar avp-filter-bar--all"
              onSubmit={handleAllSearch}
            >
              <label className="avp-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by name, email, or mobile"
                  value={allSearch}
                  onChange={(event) => setAllSearch(event.target.value)}
                />
              </label>

              <label className="avp-filter-select">
                <Filter size={16} />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">All status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>

              <Button type="submit" variant="secondary" loading={loadingAll}>
                Apply
              </Button>
            </form>

            {loadingAll ? (
              <div className="avp-empty-box avp-empty-box--large">
                Loading voters...
              </div>
            ) : allVoters.length ? (
              <div className="avp-voter-grid">
                {allVoters.map((voter) => (
                  <VoterCard
                    key={voter._id}
                    voter={voter}
                    mode="all"
                    rowActionId={rowActionId}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            ) : (
              <div className="avp-empty-box avp-empty-box--large">
                No voters found.
              </div>
            )}

            {allPagination && allTotalPages > 1 ? (
              <div className="avp-pagination">
                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={() => loadAllVoters(Math.max(allCurrentPage - 1, 1))}
                  disabled={!allPagination.hasPrevPage || loadingAll}
                >
                  Previous
                </button>

                <span>
                  Page {allCurrentPage} of {allTotalPages}
                </span>

                <button
                  type="button"
                  className="adm-primary-btn"
                  onClick={() =>
                    loadAllVoters(Math.min(allCurrentPage + 1, allTotalPages))
                  }
                  disabled={!allPagination.hasNextPage || loadingAll}
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
