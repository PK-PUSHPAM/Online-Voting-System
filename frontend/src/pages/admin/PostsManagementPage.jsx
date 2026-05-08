import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Edit3,
  Filter,
  LayoutGrid,
  ListChecks,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Trophy,
  Vote,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import { electionService } from "../../services/election.service";
import { postService } from "../../services/post.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";
import "../../styles/admin-light-theme.css";

const PAGE_LIMIT = 10;

const initialForm = {
  electionId: "",
  title: "",
  description: "",
  maxVotesPerVoter: 1,
  displayOrder: 0,
  isActive: true,
};

const initialEditForm = {
  title: "",
  description: "",
  maxVotesPerVoter: 1,
  displayOrder: 0,
  isActive: true,
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

function getElectionTitle(elections, electionId) {
  const matchedElection = elections.find(
    (election) => String(election._id) === String(electionId),
  );

  return matchedElection?.title || "Election";
}

function StatusPill({ active }) {
  return (
    <span
      className={
        active
          ? "amp-status amp-status--active"
          : "amp-status amp-status--inactive"
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone = "green" }) {
  return (
    <article className={`amp-metric-card amp-metric-card--${tone}`}>
      <div className="amp-metric-card__icon">
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

function PostCard({
  post,
  elections,
  actionId,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  const electionId =
    post?.electionId?._id || post?.electionId || post?.election?._id || "";

  const electionTitle =
    post?.electionId?.title ||
    post?.election?.title ||
    getElectionTitle(elections, electionId);

  const isActive = post?.isActive !== false;
  const isBusy = actionId === post?._id;

  return (
    <article className="amp-post-card">
      <div className="amp-post-card__top">
        <div>
          <h4>{post?.title || "Untitled post"}</h4>
          <p>{post?.description || "No post description added."}</p>
        </div>

        <StatusPill active={isActive} />
      </div>

      <div className="amp-post-card__meta">
        <div>
          <Vote size={15} />
          <span>Election</span>
          <strong>{electionTitle}</strong>
        </div>

        <div>
          <ShieldCheck size={15} />
          <span>Vote limit</span>
          <strong>{post?.maxVotesPerVoter || 1}</strong>
        </div>

        <div>
          <ListChecks size={15} />
          <span>Order</span>
          <strong>{post?.displayOrder ?? 0}</strong>
        </div>
      </div>

      <div className="amp-post-card__footer">
        <span className="amp-id-chip">
          <CheckCircle2 size={13} />
          ID: {String(post?._id || "").slice(-6)}
        </span>

        <span className="amp-id-chip">
          Created: {formatDateTime(post?.createdAt)}
        </span>
      </div>

      <div className="amp-card-actions">
        <button
          type="button"
          className="amp-action-btn amp-action-btn--edit"
          onClick={() => onEdit(post)}
          disabled={isBusy}
        >
          <Edit3 size={15} />
          Edit
        </button>

        <button
          type="button"
          className={
            isActive
              ? "amp-action-btn amp-action-btn--warning"
              : "amp-action-btn amp-action-btn--active"
          }
          onClick={() => onToggleStatus(post)}
          disabled={isBusy}
        >
          <ShieldCheck size={15} />
          {isBusy ? "Updating..." : isActive ? "Deactivate" : "Activate"}
        </button>

        <button
          type="button"
          className="amp-action-btn amp-action-btn--danger"
          onClick={() => onDelete(post)}
          disabled={isBusy}
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </article>
  );
}

export default function PostsManagementPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const [form, setForm] = useState(initialForm);
  const [posts, setPosts] = useState([]);
  const [elections, setElections] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [actionId, setActionId] = useState("");

  const [search, setSearch] = useState("");
  const [electionFilter, setElectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);

  const totalCount = Number(pagination?.totalItems || posts.length || 0);

  const stats = useMemo(() => {
    return posts.reduce(
      (acc, post) => {
        if (post?.isActive !== false) acc.active += 1;
        if (post?.isActive === false) acc.inactive += 1;
        acc.totalVoteLimit += Number(post?.maxVotesPerVoter || 1);
        return acc;
      },
      {
        active: 0,
        inactive: 0,
        totalVoteLimit: 0,
      },
    );
  }, [posts]);

  const latestPosts = useMemo(() => posts.slice(0, 5), [posts]);

  const loadElections = async () => {
    try {
      const data = await electionService.getAll({
        page: 1,
        limit: 100,
      });

      const normalizedElections = Array.isArray(data?.items) ? data.items : [];
      setElections(normalizedElections);

      setForm((current) => ({
        ...current,
        electionId: current.electionId || normalizedElections?.[0]?._id || "",
      }));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setElections([]);
    }
  };

  const loadPosts = async (pageToLoad = page) => {
    try {
      setLoading(true);

      const data = await postService.getAll({
        page: pageToLoad,
        limit: PAGE_LIMIT,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(electionFilter ? { electionId: electionFilter } : {}),
        ...(statusFilter ? { isActive: statusFilter } : {}),
      });

      setPosts(Array.isArray(data?.items) ? data.items : []);
      setPagination(data?.pagination || null);
      setPage(pageToLoad);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setPosts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadElections();
    loadPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validatePostForm = (targetForm) => {
    if (!targetForm.title.trim()) {
      toast.error("Post title is required.");
      return false;
    }

    const maxVotes = Number(targetForm.maxVotesPerVoter);

    if (!Number.isInteger(maxVotes) || maxVotes < 1 || maxVotes > 10) {
      toast.error("Max votes per voter must be between 1 and 10.");
      return false;
    }

    return true;
  };

  const validateCreateForm = () => {
    if (!form.electionId) {
      toast.error("Please select an election.");
      return false;
    }

    return validatePostForm(form);
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!validateCreateForm()) return;

    try {
      setCreateLoading(true);

      await postService.create({
        electionId: form.electionId,
        title: form.title.trim(),
        description: form.description.trim(),
        maxVotesPerVoter: Number(form.maxVotesPerVoter),
        displayOrder: Number(form.displayOrder || 0),
        isActive: Boolean(form.isActive),
      });

      toast.success("Post created successfully.");

      setForm((current) => ({
        ...initialForm,
        electionId: current.electionId,
      }));

      setActiveTab("manage");
      await loadPosts(1);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (post) => {
    setEditingPost(post);

    setEditForm({
      title: post?.title || "",
      description: post?.description || "",
      maxVotesPerVoter: Number(post?.maxVotesPerVoter || 1),
      displayOrder: Number(post?.displayOrder || 0),
      isActive: post?.isActive !== false,
    });
  };

  const closeEditModal = () => {
    setEditingPost(null);
    setEditForm(initialEditForm);
  };

  const handleUpdatePost = async (event) => {
    event.preventDefault();

    if (!editingPost?._id) return;
    if (!validatePostForm(editForm)) return;

    try {
      setUpdateLoading(true);

      await postService.update(editingPost._id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        maxVotesPerVoter: Number(editForm.maxVotesPerVoter),
        displayOrder: Number(editForm.displayOrder || 0),
        isActive: Boolean(editForm.isActive),
      });

      toast.success("Post updated successfully.");
      closeEditModal();
      await loadPosts(page);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleToggleStatus = async (post) => {
    if (!post?._id) return;

    const nextStatus = post?.isActive === false;

    const shouldContinue = window.confirm(
      nextStatus ? `Activate "${post.title}"?` : `Deactivate "${post.title}"?`,
    );

    if (!shouldContinue) return;

    try {
      setActionId(post._id);

      await postService.update(post._id, {
        isActive: nextStatus,
      });

      toast.success(nextStatus ? "Post activated." : "Post deactivated.");
      await loadPosts(page);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setActionId("");
    }
  };

  const handleDeletePost = async (post) => {
    if (!post?._id) return;

    const shouldDelete = window.confirm(
      `Delete "${post.title}"? This action cannot be undone.`,
    );

    if (!shouldDelete) return;

    try {
      setActionId(post._id);

      await postService.remove(post._id);

      toast.success("Post deleted successfully.");
      await loadPosts(1);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setActionId("");
    }
  };

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    await loadPosts(1);
  };

  const handleRefresh = async () => {
    await Promise.all([loadElections(), loadPosts(page)]);
    toast.success("Posts refreshed.");
  };

  const hasPrevPage = Boolean(pagination?.hasPrevPage);
  const hasNextPage = Boolean(pagination?.hasNextPage);
  const currentPage = Number(pagination?.currentPage || page || 1);
  const totalPages = Number(pagination?.totalPages || 1);

  return (
    <section className="admin-crud amp-page">
      <section className="amp-hero">
        <div>
          <span className="adm-eyebrow">
            <Briefcase size={15} />
            Post control
          </span>

          <h2>Manage election posts with a clean workflow.</h2>

          <div className="amp-hero-actions">
            <button
              type="button"
              className="adm-primary-btn"
              onClick={() => setActiveTab("create")}
            >
              <PlusCircle size={16} />
              Create Post
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

        <div className="amp-hero-mini-grid">
          <div>
            <span>Total</span>
            <strong>{loading ? "..." : totalCount}</strong>
          </div>

          <div>
            <span>Active</span>
            <strong>{loading ? "..." : stats.active}</strong>
          </div>

          <div>
            <span>Elections</span>
            <strong>{elections.length}</strong>
          </div>
        </div>
      </section>

      <div className="adm-tabs" role="tablist" aria-label="Post sections">
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
        <div className="amp-tab-panel">
          <div className="amp-metric-grid">
            <MetricCard
              icon={Briefcase}
              label="Total Posts"
              value={totalCount}
              helper="Across current filters"
              tone="green"
            />

            <MetricCard
              icon={CheckCircle2}
              label="Active"
              value={stats.active}
              helper="Available for voting"
              tone="purple"
            />

            <MetricCard
              icon={Trophy}
              label="Inactive"
              value={stats.inactive}
              helper="Hidden from voting"
              tone="amber"
            />

            <MetricCard
              icon={ShieldCheck}
              label="Vote Limit Sum"
              value={stats.totalVoteLimit}
              helper="Current page total"
              tone="rose"
            />
          </div>

          <section className="amp-panel-card">
            <div className="amp-panel-header">
              <div>
                <h3>Latest posts</h3>
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
              <div className="amp-empty-box">Loading posts...</div>
            ) : latestPosts.length ? (
              <div className="amp-compact-list">
                {latestPosts.map((post) => (
                  <article key={post._id} className="amp-compact-row">
                    <div className="amp-compact-row__icon">
                      <Briefcase size={16} />
                    </div>

                    <div>
                      <h4>{post?.title || "Post"}</h4>
                      <p>
                        {post?.electionId?.title ||
                          getElectionTitle(elections, post?.electionId)}{" "}
                        • Max votes {post?.maxVotesPerVoter || 1}
                      </p>
                    </div>

                    <StatusPill active={post?.isActive !== false} />
                  </article>
                ))}
              </div>
            ) : (
              <div className="amp-empty-box">No posts found.</div>
            )}
          </section>
        </div>
      )}

      {activeTab === "create" && (
        <div className="amp-tab-panel">
          <section className="amp-panel-card">
            <div className="amp-panel-header">
              <div>
                <h3>Create post</h3>
                <span>Select election and define voting position</span>
              </div>

              <span className="amp-panel-badge">New</span>
            </div>

            <form className="amp-form" onSubmit={handleCreate}>
              <div className="amp-form-grid">
                <div className="form-field amp-form-grid__full">
                  <label className="form-label">Election</label>
                  <select
                    name="electionId"
                    value={form.electionId}
                    onChange={handleChange}
                    className="admin-crud__select"
                  >
                    <option value="">Select election</option>
                    {elections.map((election) => (
                      <option key={election._id} value={election._id}>
                        {election.title}
                      </option>
                    ))}
                  </select>
                </div>

                <InputField
                  label="Post Title"
                  name="title"
                  placeholder="President / Secretary / Treasurer"
                  value={form.title}
                  onChange={handleChange}
                />

                <InputField
                  label="Max Votes Per Voter"
                  name="maxVotesPerVoter"
                  type="number"
                  min="1"
                  max="10"
                  value={form.maxVotesPerVoter}
                  onChange={handleChange}
                />

                <InputField
                  label="Display Order"
                  name="displayOrder"
                  type="number"
                  min="0"
                  value={form.displayOrder}
                  onChange={handleChange}
                />

                <label className="amp-switch-card">
                  <div>
                    <strong>Post active</strong>
                    <span>
                      Inactive posts will not be available for voting.
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                  />
                </label>

                <div className="form-field amp-form-grid__full">
                  <label className="form-label">Description</label>
                  <textarea
                    className="admin-crud__textarea"
                    name="description"
                    placeholder="Short post description"
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="amp-form-actions">
                <Button
                  className="admin-crud__submit"
                  type="submit"
                  loading={createLoading}
                  disabled={!elections.length}
                >
                  Create Post
                </Button>

                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={() =>
                    setForm((current) => ({
                      ...initialForm,
                      electionId: current.electionId,
                    }))
                  }
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
        <div className="amp-tab-panel">
          <section className="amp-panel-card">
            <div className="amp-panel-header">
              <div>
                <h3>Manage posts</h3>
                <span>{totalCount} post(s)</span>
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

            <form className="amp-filter-bar" onSubmit={handleFilterSubmit}>
              <label className="amp-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search post title"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <label className="amp-filter-select">
                <Vote size={16} />
                <select
                  value={electionFilter}
                  onChange={(event) => setElectionFilter(event.target.value)}
                >
                  <option value="">All elections</option>
                  {elections.map((election) => (
                    <option key={election._id} value={election._id}>
                      {election.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="amp-filter-select">
                <Filter size={16} />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">All status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>

              <Button type="submit" variant="secondary" loading={loading}>
                Apply
              </Button>
            </form>

            {loading ? (
              <div className="amp-empty-box amp-empty-box--large">
                Loading posts...
              </div>
            ) : posts.length ? (
              <div className="amp-post-grid">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    elections={elections}
                    actionId={actionId}
                    onEdit={openEditModal}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
            ) : (
              <div className="amp-empty-box amp-empty-box--large">
                No posts found for current filters.
              </div>
            )}

            {pagination && totalPages > 1 ? (
              <div className="amp-pagination">
                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={() => loadPosts(Math.max(currentPage - 1, 1))}
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
                    loadPosts(Math.min(currentPage + 1, totalPages))
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

      {editingPost ? (
        <div className="amp-modal-backdrop" role="presentation">
          <section className="amp-modal" role="dialog" aria-modal="true">
            <div className="amp-modal__header">
              <div>
                <h3>Edit Post</h3>
                <p>
                  Update post title, vote limit, order, status, and summary.
                </p>
              </div>

              <button
                type="button"
                className="amp-modal__close"
                onClick={closeEditModal}
                disabled={updateLoading}
              >
                <X size={18} />
              </button>
            </div>

            <form className="amp-form" onSubmit={handleUpdatePost}>
              <div className="amp-form-grid">
                <InputField
                  label="Post Title"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                />

                <InputField
                  label="Max Votes Per Voter"
                  name="maxVotesPerVoter"
                  type="number"
                  min="1"
                  max="10"
                  value={editForm.maxVotesPerVoter}
                  onChange={handleEditChange}
                />

                <InputField
                  label="Display Order"
                  name="displayOrder"
                  type="number"
                  min="0"
                  value={editForm.displayOrder}
                  onChange={handleEditChange}
                />

                <label className="amp-switch-card">
                  <div>
                    <strong>Post active</strong>
                    <span>Inactive posts stay hidden from voting.</span>
                  </div>

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={editForm.isActive}
                    onChange={handleEditChange}
                  />
                </label>

                <div className="form-field amp-form-grid__full">
                  <label className="form-label">Description</label>
                  <textarea
                    className="admin-crud__textarea"
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="amp-form-actions">
                <Button
                  className="admin-crud__submit"
                  type="submit"
                  loading={updateLoading}
                >
                  Save Changes
                </Button>

                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={closeEditModal}
                  disabled={updateLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
