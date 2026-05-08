import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Edit3,
  Filter,
  Image as ImageIcon,
  LayoutGrid,
  ListChecks,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserSquare2,
  Vote,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import { uploadService } from "../../services/upload.service";
import { candidateService } from "../../services/candidate.service";
import { electionService } from "../../services/election.service";
import { postService } from "../../services/post.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";
import "../../styles/admin-light-theme.css";

const PAGE_LIMIT = 10;

const initialForm = {
  userId: "",
  fullName: "",
  partyName: "",
  manifesto: "",
  candidatePhotoUrl: "",
  candidatePhotoPublicId: "",
  displayOrder: 0,
  isActive: true,
};

const initialEditForm = {
  fullName: "",
  partyName: "",
  manifesto: "",
  candidatePhotoUrl: "",
  candidatePhotoPublicId: "",
  displayOrder: 0,
  isActive: true,
};

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "create", label: "Create", icon: PlusCircle },
  { id: "manage", label: "Manage", icon: ListChecks },
];

function formatStatus(value = "pending") {
  return String(value || "pending")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function ApprovalPill({ status = "pending" }) {
  const normalizedStatus = String(status || "pending").toLowerCase();

  return (
    <span className={`acp-status acp-status--${normalizedStatus}`}>
      {formatStatus(normalizedStatus)}
    </span>
  );
}

function ActivePill({ active }) {
  return (
    <span
      className={
        active
          ? "acp-status acp-status--active"
          : "acp-status acp-status--inactive"
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, helper, tone = "green" }) {
  return (
    <article className={`acp-metric-card acp-metric-card--${tone}`}>
      <div className="acp-metric-card__icon">
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

function CandidateCard({
  candidate,
  selectedPost,
  selectedElection,
  onEdit,
  onApprove,
  onReject,
  onToggleActive,
  onDelete,
  actionId,
}) {
  const status = String(candidate?.approvalStatus || "pending").toLowerCase();
  const canApprove = status !== "approved";
  const canReject = status !== "rejected";
  const isActive = candidate?.isActive !== false;
  const isBusy = actionId === candidate?._id;

  return (
    <article className="acp-candidate-card">
      <div className="acp-candidate-card__top">
        <div className="acp-candidate-avatar">
          {candidate?.candidatePhotoUrl ? (
            <img
              src={candidate.candidatePhotoUrl}
              alt={candidate.fullName || "Candidate"}
            />
          ) : (
            <UserSquare2 size={24} />
          )}
        </div>

        <div className="acp-candidate-card__title">
          <h4>{candidate?.fullName || "Unnamed candidate"}</h4>
          <p>{candidate?.partyName || "Independent"}</p>
        </div>

        <ApprovalPill status={candidate?.approvalStatus} />
      </div>

      <div className="acp-candidate-card__meta">
        <div>
          <Vote size={15} />
          <span>Election</span>
          <strong>{selectedElection?.title || "Selected election"}</strong>
        </div>

        <div>
          <ShieldCheck size={15} />
          <span>Post</span>
          <strong>{selectedPost?.title || "Selected post"}</strong>
        </div>

        <div>
          <ListChecks size={15} />
          <span>Order</span>
          <strong>{candidate?.displayOrder ?? 0}</strong>
        </div>
      </div>

      {candidate?.manifesto ? (
        <div className="acp-manifesto-box">
          <strong>Manifesto</strong>
          <p>{candidate.manifesto}</p>
        </div>
      ) : null}

      <div className="acp-candidate-card__chips">
        <ActivePill active={isActive} />

        <span className="acp-id-chip">
          <CheckCircle2 size={13} />
          ID: {String(candidate?._id || "").slice(-6)}
        </span>

        <span className="acp-id-chip">
          User: {candidate?.userId?.fullName || "Not linked"}
        </span>

        {candidate?.candidatePhotoUrl ? (
          <a
            href={candidate.candidatePhotoUrl}
            target="_blank"
            rel="noreferrer"
            className="acp-id-chip"
          >
            <ImageIcon size={13} />
            Photo
          </a>
        ) : null}
      </div>

      {candidate?.rejectionReason ? (
        <div className="acp-rejection-box">
          <strong>Rejection reason</strong>
          <p>{candidate.rejectionReason}</p>
        </div>
      ) : null}

      <div className="acp-candidate-card__actions">
        <button
          type="button"
          className="acp-action-btn acp-action-btn--edit"
          onClick={() => onEdit(candidate)}
          disabled={isBusy}
        >
          <Edit3 size={15} />
          Edit
        </button>

        <button
          type="button"
          className="acp-action-btn acp-action-btn--approve"
          onClick={() => onApprove(candidate)}
          disabled={!canApprove || isBusy}
        >
          <BadgeCheck size={15} />
          {isBusy ? "Updating..." : "Approve"}
        </button>

        <button
          type="button"
          className="acp-action-btn acp-action-btn--warning"
          onClick={() => onToggleActive(candidate)}
          disabled={isBusy}
        >
          <ShieldCheck size={15} />
          {isActive ? "Deactivate" : "Activate"}
        </button>

        <button
          type="button"
          className="acp-action-btn acp-action-btn--reject"
          onClick={() => onReject(candidate)}
          disabled={!canReject || isBusy}
        >
          <XCircle size={15} />
          Reject
        </button>

        <button
          type="button"
          className="acp-action-btn acp-action-btn--danger"
          onClick={() => onDelete(candidate)}
          disabled={isBusy}
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </article>
  );
}

export default function CandidatesManagementPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const [elections, setElections] = useState([]);
  const [posts, setPosts] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const [loadingElections, setLoadingElections] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [editPhotoUploading, setEditPhotoUploading] = useState(false);
  const [actionId, setActionId] = useState("");

  const [page, setPage] = useState(1);
  const [form, setForm] = useState(initialForm);

  const [editingCandidate, setEditingCandidate] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);

  const selectedElection = useMemo(
    () => elections.find((item) => item._id === selectedElectionId) || null,
    [elections, selectedElectionId],
  );

  const selectedPost = useMemo(
    () => posts.find((item) => item._id === selectedPostId) || null,
    [posts, selectedPostId],
  );

  const totalCandidates = Number(
    pagination?.totalItems || candidates.length || 0,
  );

  const stats = useMemo(() => {
    return candidates.reduce(
      (acc, candidate) => {
        const status = String(candidate?.approvalStatus || "pending");

        if (status === "approved") acc.approved += 1;
        else if (status === "rejected") acc.rejected += 1;
        else acc.pending += 1;

        if (candidate?.isActive !== false) acc.active += 1;

        return acc;
      },
      {
        approved: 0,
        rejected: 0,
        pending: 0,
        active: 0,
      },
    );
  }, [candidates]);

  const latestCandidates = useMemo(() => candidates.slice(0, 5), [candidates]);

  const loadElections = async () => {
    try {
      setLoadingElections(true);

      const data = await electionService.getAll({ page: 1, limit: 100 });
      const items = Array.isArray(data?.items) ? data.items : [];

      setElections(items);

      if (!selectedElectionId && items.length > 0) {
        setSelectedElectionId(items[0]._id);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setElections([]);
    } finally {
      setLoadingElections(false);
    }
  };

  const loadPosts = async (electionId) => {
    if (!electionId) {
      setPosts([]);
      setSelectedPostId("");
      return;
    }

    try {
      setLoadingPosts(true);

      const data = await postService.getByElection(electionId, {
        page: 1,
        limit: 100,
      });

      const items = Array.isArray(data?.items) ? data.items : [];
      setPosts(items);

      setSelectedPostId((currentPostId) => {
        if (items.some((item) => item._id === currentPostId)) {
          return currentPostId;
        }

        return items?.[0]?._id || "";
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setPosts([]);
      setSelectedPostId("");
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadCandidates = async (postId = selectedPostId, pageToLoad = page) => {
    if (!postId) {
      setCandidates([]);
      setPagination(null);
      return;
    }

    try {
      setLoadingCandidates(true);

      const data = await candidateService.getAll({
        postId,
        page: pageToLoad,
        limit: PAGE_LIMIT,
        ...(approvalFilter ? { approvalStatus: approvalFilter } : {}),
        ...(activeFilter !== "" ? { isActive: activeFilter } : {}),
      });

      setCandidates(Array.isArray(data?.items) ? data.items : []);
      setPagination(data?.pagination || null);
      setPage(pageToLoad);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setCandidates([]);
      setPagination(null);
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    loadElections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      loadPosts(selectedElectionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElectionId]);

  useEffect(() => {
    if (selectedPostId) {
      loadCandidates(selectedPostId, 1);
    } else {
      setCandidates([]);
      setPagination(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPostId, approvalFilter, activeFilter]);

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setPhotoUploading(true);

      const uploaded = await uploadService.uploadCandidatePhoto(
        file,
        form.candidatePhotoPublicId,
      );

      setForm((current) => ({
        ...current,
        candidatePhotoUrl: uploaded?.fileUrl || "",
        candidatePhotoPublicId: uploaded?.publicId || "",
      }));

      toast.success("Candidate photo uploaded successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setPhotoUploading(false);
      event.target.value = "";
    }
  };

  const handleEditPhotoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setEditPhotoUploading(true);

      const uploaded = await uploadService.uploadCandidatePhoto(
        file,
        editForm.candidatePhotoPublicId,
      );

      setEditForm((current) => ({
        ...current,
        candidatePhotoUrl: uploaded?.fileUrl || "",
        candidatePhotoPublicId: uploaded?.publicId || "",
      }));

      toast.success("Candidate photo updated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setEditPhotoUploading(false);
      event.target.value = "";
    }
  };

  const validateCreateForm = () => {
    if (!selectedElectionId || !selectedPostId) {
      toast.error("Please select both election and post.");
      return false;
    }

    if (!form.fullName.trim()) {
      toast.error("Candidate full name is required.");
      return false;
    }

    return true;
  };

  const validateEditForm = () => {
    if (!editForm.fullName.trim()) {
      toast.error("Candidate full name is required.");
      return false;
    }

    return true;
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!validateCreateForm()) return;

    try {
      setCreateLoading(true);

      await candidateService.create({
        electionId: selectedElectionId,
        postId: selectedPostId,
        userId: form.userId.trim() || undefined,
        fullName: form.fullName.trim(),
        partyName: form.partyName.trim(),
        manifesto: form.manifesto.trim(),
        candidatePhotoUrl: form.candidatePhotoUrl,
        candidatePhotoPublicId: form.candidatePhotoPublicId,
        displayOrder: Number(form.displayOrder || 0),
        isActive: Boolean(form.isActive),
      });

      toast.success("Candidate created successfully.");
      setForm(initialForm);
      setActiveTab("manage");
      await loadCandidates(selectedPostId, 1);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (candidate) => {
    setEditingCandidate(candidate);

    setEditForm({
      fullName: candidate?.fullName || "",
      partyName: candidate?.partyName || "",
      manifesto: candidate?.manifesto || "",
      candidatePhotoUrl: candidate?.candidatePhotoUrl || "",
      candidatePhotoPublicId: candidate?.candidatePhotoPublicId || "",
      displayOrder: Number(candidate?.displayOrder || 0),
      isActive: candidate?.isActive !== false,
    });
  };

  const closeEditModal = () => {
    setEditingCandidate(null);
    setEditForm(initialEditForm);
  };

  const handleUpdateCandidate = async (event) => {
    event.preventDefault();

    if (!editingCandidate?._id) return;
    if (!validateEditForm()) return;

    try {
      setUpdateLoading(true);

      await candidateService.update(editingCandidate._id, {
        fullName: editForm.fullName.trim(),
        partyName: editForm.partyName.trim(),
        manifesto: editForm.manifesto.trim(),
        candidatePhotoUrl: editForm.candidatePhotoUrl,
        candidatePhotoPublicId: editForm.candidatePhotoPublicId,
        displayOrder: Number(editForm.displayOrder || 0),
        isActive: Boolean(editForm.isActive),
      });

      toast.success("Candidate updated successfully.");
      closeEditModal();
      await loadCandidates(selectedPostId, page);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleApproveCandidate = async (candidate) => {
    if (!candidate?._id) return;

    try {
      setActionId(candidate._id);

      await candidateService.approve(candidate._id, {
        action: "approve",
      });

      toast.success("Candidate approved.");
      await loadCandidates(selectedPostId, page);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setActionId("");
    }
  };

  const handleRejectCandidate = async (candidate) => {
    if (!candidate?._id) return;

    const reason = window.prompt(
      `Reason for rejecting ${candidate.fullName || "this candidate"}:`,
      "Candidate information is incomplete",
    );

    if (reason === null) return;

    try {
      setActionId(candidate._id);

      await candidateService.approve(candidate._id, {
        action: "reject",
        rejectionReason: reason.trim() || "Rejected by admin",
      });

      toast.success("Candidate rejected.");
      await loadCandidates(selectedPostId, page);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setActionId("");
    }
  };

  const handleToggleActive = async (candidate) => {
    if (!candidate?._id) return;

    const nextStatus = candidate?.isActive === false;

    const shouldContinue = window.confirm(
      nextStatus
        ? `Activate "${candidate.fullName}"?`
        : `Deactivate "${candidate.fullName}"?`,
    );

    if (!shouldContinue) return;

    try {
      setActionId(candidate._id);

      await candidateService.update(candidate._id, {
        isActive: nextStatus,
      });

      toast.success(
        nextStatus ? "Candidate activated." : "Candidate deactivated.",
      );

      await loadCandidates(selectedPostId, page);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setActionId("");
    }
  };

  const handleDeleteCandidate = async (candidate) => {
    if (!candidate?._id) return;

    const shouldDelete = window.confirm(
      `Delete "${candidate.fullName}"? This action cannot be undone.`,
    );

    if (!shouldDelete) return;

    try {
      setActionId(candidate._id);

      await candidateService.remove(candidate._id);

      toast.success("Candidate deleted successfully.");
      await loadCandidates(selectedPostId, 1);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setActionId("");
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      loadElections(),
      selectedElectionId ? loadPosts(selectedElectionId) : Promise.resolve(),
      selectedPostId ? loadCandidates(selectedPostId, page) : Promise.resolve(),
    ]);

    toast.success("Candidates refreshed.");
  };

  const hasPrevPage = Boolean(pagination?.hasPrevPage);
  const hasNextPage = Boolean(pagination?.hasNextPage);
  const currentPage = Number(pagination?.currentPage || page || 1);
  const totalPages = Number(pagination?.totalPages || 1);

  return (
    <section className="admin-crud acp-page">
      <section className="acp-hero">
        <div>
          <span className="adm-eyebrow">
            <UserSquare2 size={15} />
            Candidate control
          </span>

          <h2>Manage candidates with clean approval workflow.</h2>

          <div className="acp-hero-actions">
            <button
              type="button"
              className="adm-primary-btn"
              onClick={() => setActiveTab("create")}
            >
              <PlusCircle size={16} />
              Create Candidate
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

        <div className="acp-hero-mini-grid">
          <div>
            <span>Total</span>
            <strong>{loadingCandidates ? "..." : totalCandidates}</strong>
          </div>

          <div>
            <span>Approved</span>
            <strong>{loadingCandidates ? "..." : stats.approved}</strong>
          </div>

          <div>
            <span>Pending</span>
            <strong>{loadingCandidates ? "..." : stats.pending}</strong>
          </div>
        </div>
      </section>

      <div className="adm-tabs" role="tablist" aria-label="Candidate sections">
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

      <section className="acp-context-card">
        <div className="acp-context-grid">
          <label>
            <span>Election</span>
            <select
              value={selectedElectionId}
              onChange={(event) => setSelectedElectionId(event.target.value)}
              disabled={loadingElections}
            >
              {elections.length === 0 ? (
                <option value="">No elections found</option>
              ) : (
                elections.map((election) => (
                  <option key={election._id} value={election._id}>
                    {election.title}
                  </option>
                ))
              )}
            </select>
          </label>

          <label>
            <span>Post</span>
            <select
              value={selectedPostId}
              onChange={(event) => setSelectedPostId(event.target.value)}
              disabled={loadingPosts || posts.length === 0}
            >
              {posts.length === 0 ? (
                <option value="">No posts found</option>
              ) : (
                posts.map((post) => (
                  <option key={post._id} value={post._id}>
                    {post.title}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
      </section>

      {activeTab === "overview" && (
        <div className="acp-tab-panel">
          <div className="acp-metric-grid">
            <MetricCard
              icon={UserSquare2}
              label="Total Candidates"
              value={totalCandidates}
              helper="For selected post"
              tone="green"
            />

            <MetricCard
              icon={BadgeCheck}
              label="Approved"
              value={stats.approved}
              helper="Ready for ballot"
              tone="purple"
            />

            <MetricCard
              icon={Filter}
              label="Pending"
              value={stats.pending}
              helper="Needs action"
              tone="amber"
            />

            <MetricCard
              icon={XCircle}
              label="Rejected"
              value={stats.rejected}
              helper="Not eligible"
              tone="rose"
            />
          </div>

          <section className="acp-panel-card">
            <div className="acp-panel-header">
              <div>
                <h3>Latest candidates</h3>
                <span>Quick preview from selected post</span>
              </div>

              <button
                type="button"
                className="adm-secondary-btn"
                onClick={() => setActiveTab("manage")}
              >
                Open Manage
              </button>
            </div>

            {loadingCandidates ? (
              <div className="acp-empty-box">Loading candidates...</div>
            ) : latestCandidates.length ? (
              <div className="acp-compact-list">
                {latestCandidates.map((candidate) => (
                  <article key={candidate._id} className="acp-compact-row">
                    <div className="acp-compact-row__avatar">
                      {candidate?.candidatePhotoUrl ? (
                        <img
                          src={candidate.candidatePhotoUrl}
                          alt={candidate.fullName || "Candidate"}
                        />
                      ) : (
                        <UserSquare2 size={17} />
                      )}
                    </div>

                    <div>
                      <h4>{candidate?.fullName || "Candidate"}</h4>
                      <p>
                        {candidate?.partyName || "Independent"} •{" "}
                        {candidate?.isActive !== false ? "Active" : "Inactive"}
                      </p>
                    </div>

                    <ApprovalPill status={candidate?.approvalStatus} />
                  </article>
                ))}
              </div>
            ) : (
              <div className="acp-empty-box">
                No candidates found for selected post.
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "create" && (
        <div className="acp-tab-panel">
          <section className="acp-panel-card">
            <div className="acp-panel-header">
              <div>
                <h3>Create candidate</h3>
                <span>
                  Candidate will be added under selected election and post
                </span>
              </div>

              <span className="acp-panel-badge">New</span>
            </div>

            <form className="acp-form" onSubmit={handleCreate}>
              <div className="acp-form-grid">
                <InputField
                  label="Candidate Full Name"
                  name="fullName"
                  placeholder="Enter candidate name"
                  value={form.fullName}
                  onChange={handleFormChange}
                />

                <InputField
                  label="Party / Group Name"
                  name="partyName"
                  placeholder="Independent or party name"
                  value={form.partyName}
                  onChange={handleFormChange}
                />

                <InputField
                  label="Linked User ID"
                  name="userId"
                  placeholder="Optional MongoDB user ID"
                  value={form.userId}
                  onChange={handleFormChange}
                />

                <InputField
                  label="Display Order"
                  name="displayOrder"
                  type="number"
                  min="0"
                  value={form.displayOrder}
                  onChange={handleFormChange}
                />

                <label className="acp-switch-card">
                  <div>
                    <strong>Candidate active</strong>
                    <span>Inactive candidates stay hidden from voting.</span>
                  </div>

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleFormChange}
                  />
                </label>

                <label className="acp-upload-card">
                  <div>
                    <strong>Candidate photo</strong>
                    <span>
                      {form.candidatePhotoUrl
                        ? "Photo uploaded successfully"
                        : "PNG, JPG, JPEG, or WEBP"}
                    </span>
                  </div>

                  <span className="adm-secondary-btn">
                    {photoUploading ? "Uploading..." : "Upload Photo"}
                  </span>

                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={handlePhotoChange}
                    hidden
                  />
                </label>

                <div className="form-field acp-form-grid__full">
                  <label className="form-label">Manifesto</label>
                  <textarea
                    className="admin-crud__textarea"
                    name="manifesto"
                    placeholder="Short manifesto or public candidate summary"
                    value={form.manifesto}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="acp-form-actions">
                <Button
                  className="admin-crud__submit"
                  type="submit"
                  loading={createLoading}
                  disabled={!selectedElectionId || !selectedPostId}
                >
                  Create Candidate
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
        <div className="acp-tab-panel">
          <section className="acp-panel-card">
            <div className="acp-panel-header">
              <div>
                <h3>Manage candidates</h3>
                <span>{totalCandidates} candidate(s)</span>
              </div>

              <button
                type="button"
                className="adm-secondary-btn"
                onClick={handleRefresh}
                disabled={loadingCandidates}
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>

            <div className="acp-filter-bar">
              <label className="acp-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search is controlled by selected post list"
                  disabled
                />
              </label>

              <label className="acp-filter-select">
                <Filter size={16} />
                <select
                  value={approvalFilter}
                  onChange={(event) => setApprovalFilter(event.target.value)}
                >
                  <option value="">All approvals</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>

              <label className="acp-filter-select">
                <CheckCircle2 size={16} />
                <select
                  value={activeFilter}
                  onChange={(event) => setActiveFilter(event.target.value)}
                >
                  <option value="">All status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
            </div>

            {!selectedPostId ? (
              <div className="acp-empty-box acp-empty-box--large">
                Please select a post to manage candidates.
              </div>
            ) : loadingCandidates ? (
              <div className="acp-empty-box acp-empty-box--large">
                Loading candidates...
              </div>
            ) : candidates.length ? (
              <div className="acp-candidate-grid">
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate._id}
                    candidate={candidate}
                    selectedPost={selectedPost}
                    selectedElection={selectedElection}
                    onEdit={openEditModal}
                    onApprove={handleApproveCandidate}
                    onReject={handleRejectCandidate}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDeleteCandidate}
                    actionId={actionId}
                  />
                ))}
              </div>
            ) : (
              <div className="acp-empty-box acp-empty-box--large">
                No candidates found for selected filters.
              </div>
            )}

            {pagination && totalPages > 1 ? (
              <div className="acp-pagination">
                <button
                  type="button"
                  className="adm-secondary-btn"
                  onClick={() =>
                    loadCandidates(selectedPostId, Math.max(currentPage - 1, 1))
                  }
                  disabled={!hasPrevPage || loadingCandidates}
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
                    loadCandidates(
                      selectedPostId,
                      Math.min(currentPage + 1, totalPages),
                    )
                  }
                  disabled={!hasNextPage || loadingCandidates}
                >
                  Next
                </button>
              </div>
            ) : null}
          </section>
        </div>
      )}

      {editingCandidate ? (
        <div className="acp-modal-backdrop" role="presentation">
          <section className="acp-modal" role="dialog" aria-modal="true">
            <div className="acp-modal__header">
              <div>
                <h3>Edit Candidate</h3>
                <p>
                  Update candidate profile, manifesto, order, status, and photo.
                </p>
              </div>

              <button
                type="button"
                className="acp-modal__close"
                onClick={closeEditModal}
                disabled={updateLoading}
              >
                <X size={18} />
              </button>
            </div>

            <form className="acp-form" onSubmit={handleUpdateCandidate}>
              <div className="acp-form-grid">
                <InputField
                  label="Candidate Full Name"
                  name="fullName"
                  value={editForm.fullName}
                  onChange={handleEditFormChange}
                />

                <InputField
                  label="Party / Group Name"
                  name="partyName"
                  value={editForm.partyName}
                  onChange={handleEditFormChange}
                />

                <InputField
                  label="Display Order"
                  name="displayOrder"
                  type="number"
                  min="0"
                  value={editForm.displayOrder}
                  onChange={handleEditFormChange}
                />

                <label className="acp-switch-card">
                  <div>
                    <strong>Candidate active</strong>
                    <span>Inactive candidates stay hidden from voting.</span>
                  </div>

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={editForm.isActive}
                    onChange={handleEditFormChange}
                  />
                </label>

                <label className="acp-upload-card acp-form-grid__full">
                  <div>
                    <strong>Candidate photo</strong>
                    <span>
                      {editForm.candidatePhotoUrl
                        ? "Photo available. Upload again to replace."
                        : "PNG, JPG, JPEG, or WEBP"}
                    </span>
                  </div>

                  <span className="adm-secondary-btn">
                    {editPhotoUploading ? "Uploading..." : "Replace Photo"}
                  </span>

                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={handleEditPhotoChange}
                    hidden
                  />
                </label>

                {editForm.candidatePhotoUrl ? (
                  <div className="acp-photo-preview acp-form-grid__full">
                    <img
                      src={editForm.candidatePhotoUrl}
                      alt={editForm.fullName || "Candidate"}
                    />
                    <div>
                      <strong>Current photo</strong>
                      <a
                        href={editForm.candidatePhotoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open image
                      </a>
                    </div>
                  </div>
                ) : null}

                <div className="form-field acp-form-grid__full">
                  <label className="form-label">Manifesto</label>
                  <textarea
                    className="admin-crud__textarea"
                    name="manifesto"
                    value={editForm.manifesto}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="acp-form-actions">
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
