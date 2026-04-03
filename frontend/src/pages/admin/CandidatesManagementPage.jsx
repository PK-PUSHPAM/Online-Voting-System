import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Image as ImageIcon,
  ShieldCheck,
  UserSquare2,
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

const approvalClassMap = {
  approved: "admin-crud__status admin-crud__status--approved",
  rejected: "admin-crud__status admin-crud__status--rejected",
  pending: "admin-crud__status admin-crud__status--pending",
};

export default function CandidatesManagementPage() {
  const [elections, setElections] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loadingElections, setLoadingElections] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [form, setForm] = useState(initialForm);

  const selectedElection = useMemo(
    () => elections.find((item) => item._id === selectedElectionId) || null,
    [elections, selectedElectionId],
  );

  const selectedPost = useMemo(
    () => posts.find((item) => item._id === selectedPostId) || null,
    [posts, selectedPostId],
  );

  const totalCandidates = useMemo(
    () => pagination?.totalItems || candidates.length || 0,
    [pagination, candidates.length],
  );

  const approvedCandidates = useMemo(
    () =>
      candidates.filter((item) => item.approvalStatus === "approved").length,
    [candidates],
  );

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

      if (items.length > 0) {
        setSelectedPostId((prev) =>
          items.some((item) => item._id === prev) ? prev : items[0]._id,
        );
      } else {
        setSelectedPostId("");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setPosts([]);
      setSelectedPostId("");
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadCandidates = async (postId) => {
    if (!postId) {
      setCandidates([]);
      setPagination(null);
      return;
    }

    try {
      setLoadingCandidates(true);
      const data = await candidateService.getByPost(postId, {
        page: 1,
        limit: 100,
        ...(approvalFilter ? { approvalStatus: approvalFilter } : {}),
      });

      setCandidates(Array.isArray(data?.items) ? data.items : []);
      setPagination(data?.pagination || null);
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
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      loadPosts(selectedElectionId);
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (selectedPostId) {
      loadCandidates(selectedPostId);
    } else {
      setCandidates([]);
      setPagination(null);
    }
  }, [selectedPostId, approvalFilter]);

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
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

      setForm((prev) => ({
        ...prev,
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

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!selectedElectionId || !selectedPostId) {
      toast.error("Please select both an election and a post.");
      return;
    }

    if (!form.fullName.trim()) {
      toast.error("Candidate name is required.");
      return;
    }

    try {
      setCreateLoading(true);

      await candidateService.create(selectedElectionId, selectedPostId, {
        userId: form.userId.trim() || undefined,
        fullName: form.fullName.trim(),
        partyName: form.partyName.trim(),
        manifesto: form.manifesto.trim(),
        candidatePhotoUrl: form.candidatePhotoUrl,
        candidatePhotoPublicId: form.candidatePhotoPublicId,
        displayOrder: Number(form.displayOrder),
        isActive: form.isActive,
      });

      toast.success("Candidate created successfully.");
      setForm(initialForm);
      await loadCandidates(selectedPostId);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <section className="admin-crud">
      <div className="admin-crud__hero">
        <div className="admin-crud__hero-copy">
          <span className="admin-crud__eyebrow">
            <UserSquare2 size={14} />
            Candidate management
          </span>

          <h2>
            Create and review candidate records with clear election and post
            mapping.
          </h2>

          <p>
            Candidate records should remain complete, structured, and easy to
            audit. Election mapping, post association, profile image, and
            approval state all need to remain consistent for a reliable ballot
            experience.
          </p>
        </div>

        <div className="admin-crud__hero-grid">
          <div className="admin-crud__hero-stat">
            <span>Selected election</span>
            <strong>
              {selectedElection ? selectedElection.title.slice(0, 18) : "None"}
            </strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Selected post</span>
            <strong>
              {selectedPost ? selectedPost.title.slice(0, 18) : "None"}
            </strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Total candidates</span>
            <strong>{totalCandidates}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Approved</span>
            <strong>{approvedCandidates}</strong>
          </div>
        </div>
      </div>

      <div className="admin-crud__grid">
        <div className="admin-crud__panel admin-crud__panel--sticky">
          <div className="admin-crud__panel-header">
            <div>
              <h3>Create candidate</h3>
              <p>
                Add a candidate profile under the selected election and post.
              </p>
            </div>
            <span className="admin-crud__panel-badge">03</span>
          </div>

          <form className="admin-crud__form" onSubmit={handleCreate}>
            <div className="admin-crud__form-grid">
              <div className="form-field">
                <label className="form-label">Election</label>
                <select
                  className="admin-crud__select"
                  value={selectedElectionId}
                  onChange={(event) =>
                    setSelectedElectionId(event.target.value)
                  }
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
              </div>

              <div className="form-field">
                <label className="form-label">Post</label>
                <select
                  className="admin-crud__select"
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
              </div>
            </div>

            <InputField
              label="Candidate Full Name"
              name="fullName"
              placeholder="Enter candidate name"
              value={form.fullName}
              onChange={handleFormChange}
            />

            <div className="admin-crud__form-grid">
              <InputField
                label="Linked User ID"
                name="userId"
                placeholder="Optional MongoDB user ID"
                value={form.userId}
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
                label="Display Order"
                name="displayOrder"
                type="number"
                min="0"
                value={form.displayOrder}
                onChange={handleFormChange}
              />

              <div className="admin-crud__switch-row">
                <div className="admin-crud__switch-copy">
                  <strong>Mark candidate as active</strong>
                  <span>
                    Inactive candidates remain stored but should not appear in
                    active selection flows.
                  </span>
                </div>

                <input
                  className="admin-crud__checkbox"
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Manifesto</label>
              <textarea
                className="admin-crud__textarea"
                name="manifesto"
                placeholder="Provide a short manifesto or public candidate summary."
                value={form.manifesto}
                onChange={handleFormChange}
              />
            </div>

            <div className="admin-crud__switch-row">
              <div className="admin-crud__switch-copy">
                <strong>Candidate photo</strong>
                <span>
                  Upload a profile image to improve ballot readability and
                  identity clarity.
                </span>
              </div>

              <label
                className="btn btn--secondary btn--md"
                style={{ width: "auto" }}
              >
                {photoUploading ? "Uploading..." : "Upload Photo"}
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={handlePhotoChange}
                  hidden
                />
              </label>
            </div>

            {form.candidatePhotoUrl ? (
              <p className="admin-crud__inline-note">
                Candidate photo uploaded successfully.
              </p>
            ) : null}

            <Button
              className="admin-crud__submit"
              type="submit"
              loading={createLoading}
            >
              Create Candidate
            </Button>
          </form>
        </div>

        <div className="admin-crud__panel">
          <div className="admin-crud__toolbar">
            <div className="admin-crud__toolbar-left">
              <h3 style={{ margin: 0 }}>Candidates list</h3>
              <span className="admin-crud__meta">
                {totalCandidates} item(s)
              </span>
            </div>

            <div className="admin-crud__toolbar-right">
              <select
                className="admin-crud__select"
                value={approvalFilter}
                onChange={(event) => setApprovalFilter(event.target.value)}
                style={{ minWidth: 160 }}
              >
                <option value="">All approvals</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {!selectedPostId ? (
            <div className="admin-crud__empty">
              <p>Please select a post to view and manage its candidates.</p>
            </div>
          ) : loadingCandidates ? (
            <div className="admin-crud__empty">
              <p>Loading candidates...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="admin-crud__empty">
              <p>No candidates are available for the selected post.</p>
            </div>
          ) : (
            <div className="admin-crud__list">
              {candidates.map((candidate) => (
                <article key={candidate._id} className="admin-crud__card">
                  <div className="admin-crud__card-top">
                    <div className="admin-crud__title-stack">
                      <h4>{candidate.fullName}</h4>
                      <p>{candidate.partyName || "No party specified"}</p>
                    </div>

                    <span
                      className={
                        approvalClassMap[candidate.approvalStatus] ||
                        "admin-crud__status admin-crud__status--pending"
                      }
                    >
                      {candidate.approvalStatus || "pending"}
                    </span>
                  </div>

                  <div className="admin-crud__chips">
                    <span className="admin-crud__chip">
                      <ShieldCheck size={14} />
                      {selectedPost?.title || "Unknown post"}
                    </span>
                    <span className="admin-crud__chip">
                      <CheckCircle2 size={14} />
                      {candidate.isActive
                        ? "Active candidate"
                        : "Inactive candidate"}
                    </span>
                    <span className="admin-crud__chip">
                      User: {candidate.userId?.fullName || "No linked user"}
                    </span>
                    {candidate.candidatePhotoUrl ? (
                      <a
                        href={candidate.candidatePhotoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-crud__chip"
                      >
                        <ImageIcon size={14} />
                        Open photo
                      </a>
                    ) : null}
                  </div>

                  {candidate.manifesto ? (
                    <>
                      <hr className="admin-crud__divider" />
                      <p className="admin-crud__inline-note">
                        {candidate.manifesto}
                      </p>
                    </>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
