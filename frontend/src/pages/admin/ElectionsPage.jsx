import { useEffect, useMemo, useState } from "react";
import { CalendarRange, CheckCircle2, Globe2, Vote } from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import { electionService } from "../../services/election.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";

const initialForm = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  isPublished: false,
  allowedVoterType: "verifiedOnly",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const getStatusClass = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "active")
    return "admin-crud__status admin-crud__status--active";
  if (value === "ended") return "admin-crud__status admin-crud__status--ended";
  return "admin-crud__status admin-crud__status--upcoming";
};

export default function ElectionsPage() {
  const [form, setForm] = useState(initialForm);
  const [elections, setElections] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const totalCount = useMemo(
    () => pagination?.totalItems || elections.length || 0,
    [pagination, elections.length],
  );

  const publishedCount = useMemo(
    () => elections.filter((item) => item.isPublished).length,
    [elections],
  );

  const activeCount = useMemo(
    () => elections.filter((item) => item.status === "active").length,
    [elections],
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
      toast.error("End date must be later than the start date.");
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
      await loadElections();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    await loadElections();
  };

  return (
    <section className="admin-crud">
      <div className="admin-crud__hero">
        <div className="admin-crud__hero-copy">
          <span className="admin-crud__eyebrow">
            <Vote size={14} />
            Election lifecycle
          </span>

          <h2>
            Create, publish, and monitor election timelines with full
            administrative control.
          </h2>

          <p>
            Election setup should remain structured and predictable. Define
            titles, timelines, publication state, and voter access rules clearly
            so that downstream voting and results workflows remain consistent.
          </p>
        </div>

        <div className="admin-crud__hero-grid">
          <div className="admin-crud__hero-stat">
            <span>Total shown</span>
            <strong>{totalCount}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Published</span>
            <strong>{publishedCount}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Active now</span>
            <strong>{activeCount}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Status filter</span>
            <strong>{statusFilter || "All"}</strong>
          </div>
        </div>
      </div>

      <div className="admin-crud__grid">
        <div className="admin-crud__panel admin-crud__panel--sticky">
          <div className="admin-crud__panel-header">
            <div>
              <h3>Create election</h3>
              <p>
                Configure the election details carefully before publishing it to
                voters.
              </p>
            </div>
            <span className="admin-crud__panel-badge">01</span>
          </div>

          <form className="admin-crud__form" onSubmit={handleCreate}>
            <InputField
              label="Election Title"
              name="title"
              placeholder="Student Council General Election 2026"
              value={form.title}
              onChange={handleChange}
            />

            <div className="form-field">
              <label className="form-label">Description</label>
              <textarea
                className="admin-crud__textarea"
                name="description"
                placeholder="Provide a short description of the election purpose and scope."
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="admin-crud__form-grid">
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

              <div className="form-field">
                <label className="form-label">Allowed Voter Type</label>
                <select
                  name="allowedVoterType"
                  value={form.allowedVoterType}
                  onChange={handleChange}
                  className="admin-crud__select"
                >
                  <option value="verifiedOnly">Verified Only</option>
                  <option value="all">All</option>
                </select>
              </div>

              <div className="admin-crud__switch-row">
                <div className="admin-crud__switch-copy">
                  <strong>Publish immediately</strong>
                  <span>
                    Leave unchecked if you want to save the election in draft
                    mode first.
                  </span>
                </div>

                <input
                  className="admin-crud__checkbox"
                  type="checkbox"
                  name="isPublished"
                  checked={form.isPublished}
                  onChange={handleChange}
                />
              </div>
            </div>

            <p className="admin-crud__inline-note">
              Make sure the timeline is correct before publishing. Invalid
              scheduling can disrupt the election flow.
            </p>

            <Button
              className="admin-crud__submit"
              type="submit"
              loading={createLoading}
            >
              Create Election
            </Button>
          </form>
        </div>

        <div className="admin-crud__panel">
          <div className="admin-crud__toolbar">
            <div className="admin-crud__toolbar-left">
              <h3 style={{ margin: 0 }}>Election list</h3>
              <span className="admin-crud__meta">{totalCount} item(s)</span>
            </div>

            <form
              className="admin-crud__toolbar-right"
              onSubmit={handleFilterSubmit}
            >
              <InputField
                className="admin-crud__search"
                placeholder="Search election title"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <select
                className="admin-crud__select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={{ minWidth: 150 }}
              >
                <option value="">All status</option>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
              </select>

              <Button type="submit" variant="secondary" loading={loading}>
                Apply
              </Button>
            </form>
          </div>

          {loading ? (
            <div className="admin-crud__empty">
              <p>Loading elections...</p>
            </div>
          ) : elections.length === 0 ? (
            <div className="admin-crud__empty">
              <p>No elections are available for the current filters.</p>
            </div>
          ) : (
            <div className="admin-crud__list">
              {elections.map((election) => (
                <article key={election._id} className="admin-crud__card">
                  <div className="admin-crud__card-top">
                    <div className="admin-crud__title-stack">
                      <h4>{election.title}</h4>
                      <p>
                        {election.description || "No description provided."}
                      </p>
                    </div>

                    <span className={getStatusClass(election.status)}>
                      {election.status || "upcoming"}
                    </span>
                  </div>

                  <div className="admin-crud__chips">
                    <span className="admin-crud__chip">
                      <CalendarRange size={14} />
                      {formatDateTime(election.startDate)}
                    </span>
                    <span className="admin-crud__chip">
                      <CalendarRange size={14} />
                      {formatDateTime(election.endDate)}
                    </span>
                    <span
                      className={`admin-crud__status ${
                        election.isPublished
                          ? "admin-crud__status--published"
                          : "admin-crud__status--draft"
                      }`}
                    >
                      {election.isPublished ? "Published" : "Draft"}
                    </span>
                    <span className="admin-crud__chip">
                      <Globe2 size={14} />
                      {election.allowedVoterType === "all"
                        ? "All voters"
                        : "Verified only"}
                    </span>
                    <span className="admin-crud__chip">
                      <CheckCircle2 size={14} />
                      ID: {election._id?.slice(-6)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
