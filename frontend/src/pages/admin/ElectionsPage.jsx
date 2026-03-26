import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { electionService } from "../../services/election.service";
import { getApiErrorMessage } from "../../lib/utils";

const initialForm = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  isPublished: false,
  allowedVoterType: "verifiedOnly",
};

const pageSectionStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const pageHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
};

const cardStyle = {
  padding: "20px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const fullWidthStyle = {
  gridColumn: "1 / -1",
};

const tableWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  gap: "12px",
  padding: "0 6px",
  color: "#97a6ba",
  fontSize: "13px",
};

const tableRowStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  gap: "12px",
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.06)",
  alignItems: "center",
};

const badgeBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "92px",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "capitalize",
};

const actionsBarStyle = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
  flexWrap: "wrap",
};

const searchStyle = {
  minWidth: "240px",
};

const smallMutedStyle = {
  margin: 0,
  color: "#97a6ba",
  fontSize: "14px",
};

const titleCellStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
}

function getStatusBadgeStyle(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "active") {
    return {
      ...badgeBaseStyle,
      background: "rgba(16,185,129,0.15)",
      color: "#34d399",
      border: "1px solid rgba(16,185,129,0.35)",
    };
  }

  if (normalized === "ended") {
    return {
      ...badgeBaseStyle,
      background: "rgba(239,68,68,0.14)",
      color: "#fca5a5",
      border: "1px solid rgba(239,68,68,0.3)",
    };
  }

  return {
    ...badgeBaseStyle,
    background: "rgba(245,158,11,0.14)",
    color: "#fcd34d",
    border: "1px solid rgba(245,158,11,0.3)",
  };
}

export default function ElectionsPage() {
  const [elections, setElections] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(initialForm);

  const totalCount = useMemo(
    () => pagination?.totalItems || elections.length || 0,
    [pagination, elections.length],
  );

  const loadElections = async () => {
    try {
      setLoading(true);

      const data = await electionService.getAll({
        page: 1,
        limit: 20,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });

      setElections(Array.isArray(data?.items) ? data.items : []);
      setPagination(data?.pagination || null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setElections([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadElections();
  }, []);

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    await loadElections();
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      toast.error("Election title is required");
      return false;
    }

    if (!form.startDate) {
      toast.error("Start date is required");
      return false;
    }

    if (!form.endDate) {
      toast.error("End date is required");
      return false;
    }

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error("Invalid start or end date");
      return false;
    }

    if (start >= end) {
      toast.error("End date must be greater than start date");
      return false;
    }

    return true;
  };

  const handleCreateElection = async (event) => {
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

      toast.success("Election created successfully");
      setForm(initialForm);
      await loadElections();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <section style={pageSectionStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={{ margin: 0 }}>Elections</h1>
          <p style={smallMutedStyle}>
            Create, review, and track all elections from one place.
          </p>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Create Election</h3>

        <form
          className="auth-form auth-form--grid"
          onSubmit={handleCreateElection}
        >
          <div className="form-field">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              name="title"
              placeholder="Student Council Election 2026"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Allowed Voter Type</label>
            <select
              className="form-input"
              name="allowedVoterType"
              value={form.allowedVoterType}
              onChange={handleChange}
            >
              <option value="verifiedOnly">Verified Only</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="form-field" style={fullWidthStyle}>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              name="description"
              placeholder="Brief election description"
              value={form.description}
              onChange={handleChange}
              style={{
                minHeight: "110px",
                paddingTop: "14px",
                resize: "vertical",
              }}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Start Date & Time</label>
            <input
              className="form-input"
              type="datetime-local"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label className="form-label">End Date & Time</label>
            <input
              className="form-input"
              type="datetime-local"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
            />
          </div>

          <label
            style={{
              ...fullWidthStyle,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#d9e5f2",
            }}
          >
            <input
              type="checkbox"
              name="isPublished"
              checked={form.isPublished}
              onChange={handleChange}
            />
            Publish immediately
          </label>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={createLoading}
            style={fullWidthStyle}
          >
            {createLoading ? "Creating..." : "Create Election"}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <div style={pageHeaderStyle}>
          <div>
            <h3 style={{ margin: 0 }}>Election List</h3>
            <p style={smallMutedStyle}>{totalCount} total elections found</p>
          </div>

          <form onSubmit={handleFilterSubmit} style={actionsBarStyle}>
            <input
              className="form-input"
              placeholder="Search by title or description"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={searchStyle}
            />

            <select
              className="form-input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={{ minWidth: "160px" }}
            >
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>

            <button
              type="submit"
              className="btn btn--secondary"
              style={{ width: "auto" }}
            >
              Apply
            </button>
          </form>
        </div>

        {loading ? (
          <p style={smallMutedStyle}>Loading elections...</p>
        ) : elections.length === 0 ? (
          <p style={smallMutedStyle}>No elections found.</p>
        ) : (
          <div style={tableWrapperStyle}>
            <div style={tableHeaderStyle}>
              <span>Election</span>
              <span>Status</span>
              <span>Published</span>
              <span>Start</span>
              <span>End</span>
            </div>

            {elections.map((election) => (
              <div key={election._id} style={tableRowStyle}>
                <div style={titleCellStyle}>
                  <strong>{election.title}</strong>
                  <span style={smallMutedStyle}>
                    {election.description || "No description"}
                  </span>
                </div>

                <div>
                  <span style={getStatusBadgeStyle(election.status)}>
                    {election.status || "upcoming"}
                  </span>
                </div>

                <div>{election.isPublished ? "Yes" : "No"}</div>
                <div>{formatDateTime(election.startDate)}</div>
                <div>{formatDateTime(election.endDate)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
