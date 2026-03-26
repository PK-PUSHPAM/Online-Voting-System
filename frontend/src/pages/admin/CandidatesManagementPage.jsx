import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { electionService } from "../../services/election.service";
import { postService } from "../../services/post.service";
import { candidateService } from "../../services/candidate.service";
import { getApiErrorMessage } from "../../lib/utils";

const sectionStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const headerStyle = {
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

const mutedStyle = {
  margin: 0,
  color: "#97a6ba",
  fontSize: "14px",
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
  gap: "12px",
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.06)",
  alignItems: "center",
};

const headerRowStyle = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
  gap: "12px",
  padding: "0 6px",
  color: "#97a6ba",
  fontSize: "13px",
};

const initialForm = {
  fullName: "",
  partyName: "",
  manifesto: "",
  candidatePhotoUrl: "",
  candidatePhotoPublicId: "",
  displayOrder: 0,
  isActive: true,
};

export default function CandidatesManagementPage() {
  const [elections, setElections] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loadingElections, setLoadingElections] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [actionCandidateId, setActionCandidateId] = useState("");
  const [form, setForm] = useState(initialForm);

  const totalCandidates = useMemo(
    () => pagination?.totalItems || candidates.length || 0,
    [pagination, candidates.length],
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
        setSelectedPostId(items[0]._id);
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
        limit: 50,
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
  }, [selectedPostId]);

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!selectedElectionId) {
      toast.error("Select an election first");
      return;
    }

    if (!selectedPostId) {
      toast.error("Select a post first");
      return;
    }

    if (!form.fullName.trim()) {
      toast.error("Candidate full name is required");
      return;
    }

    try {
      setCreateLoading(true);

      await candidateService.create(selectedElectionId, selectedPostId, {
        fullName: form.fullName.trim(),
        partyName: form.partyName.trim(),
        manifesto: form.manifesto.trim(),
        candidatePhotoUrl: form.candidatePhotoUrl.trim(),
        candidatePhotoPublicId: form.candidatePhotoPublicId.trim(),
        displayOrder: Number(form.displayOrder),
        isActive: form.isActive,
      });

      toast.success("Candidate created successfully");
      setForm(initialForm);
      await loadCandidates(selectedPostId);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleApprove = async (candidateId) => {
    try {
      setActionCandidateId(candidateId);

      await candidateService.approve(candidateId, {
        action: "approve",
      });

      toast.success("Candidate approved successfully");
      await loadCandidates(selectedPostId);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setActionCandidateId("");
    }
  };

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>Candidates Management</h1>
          <p style={mutedStyle}>Add and approve candidates for each post.</p>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Selection</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          }}
        >
          <div className="form-field">
            <label className="form-label">Election</label>
            <select
              className="form-input"
              value={selectedElectionId}
              onChange={(event) => setSelectedElectionId(event.target.value)}
              disabled={loadingElections}
            >
              <option value="">Select election</option>
              {elections.map((election) => (
                <option key={election._id} value={election._id}>
                  {election.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Post</label>
            <select
              className="form-input"
              value={selectedPostId}
              onChange={(event) => setSelectedPostId(event.target.value)}
              disabled={loadingPosts || posts.length === 0}
            >
              <option value="">Select post</option>
              {posts.map((post) => (
                <option key={post._id} value={post._id}>
                  {post.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Create Candidate</h3>

        <form className="auth-form auth-form--grid" onSubmit={handleCreate}>
          <div className="form-field">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              name="fullName"
              placeholder="Rahul Verma"
              value={form.fullName}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Party Name</label>
            <input
              className="form-input"
              name="partyName"
              placeholder="Student Unity"
              value={form.partyName}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Photo URL</label>
            <input
              className="form-input"
              name="candidatePhotoUrl"
              placeholder="https://..."
              value={form.candidatePhotoUrl}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Photo Public ID</label>
            <input
              className="form-input"
              name="candidatePhotoPublicId"
              placeholder="candidate/photo-1"
              value={form.candidatePhotoPublicId}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Manifesto</label>
            <textarea
              className="form-input"
              name="manifesto"
              placeholder="Candidate manifesto"
              value={form.manifesto}
              onChange={handleFormChange}
              style={{
                minHeight: "110px",
                paddingTop: "14px",
                resize: "vertical",
              }}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Display Order</label>
            <input
              className="form-input"
              type="number"
              min="0"
              name="displayOrder"
              value={form.displayOrder}
              onChange={handleFormChange}
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#d9e5f2",
            }}
          >
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleFormChange}
            />
            Active
          </label>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={createLoading}
            style={{ gridColumn: "1 / -1" }}
          >
            {createLoading ? "Creating..." : "Create Candidate"}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <h3 style={{ margin: 0 }}>Candidates List</h3>
            <p style={mutedStyle}>{totalCandidates} candidates found</p>
          </div>
        </div>

        {!selectedPostId ? (
          <p style={mutedStyle}>Select a post to view candidates.</p>
        ) : loadingCandidates ? (
          <p style={mutedStyle}>Loading candidates...</p>
        ) : candidates.length === 0 ? (
          <p style={mutedStyle}>No candidates found for this post.</p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div style={headerRowStyle}>
              <span>Candidate</span>
              <span>Party</span>
              <span>Status</span>
              <span>Active</span>
              <span>Action</span>
            </div>

            {candidates.map((candidate) => {
              const busy = actionCandidateId === candidate._id;

              return (
                <div key={candidate._id} style={rowStyle}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <strong>{candidate.fullName}</strong>
                    <span style={mutedStyle}>
                      Order: {candidate.displayOrder ?? 0}
                    </span>
                  </div>

                  <div>{candidate.partyName || "-"}</div>
                  <div>{candidate.approvalStatus || "pending"}</div>
                  <div>{candidate.isActive ? "Yes" : "No"}</div>

                  <div>
                    <button
                      className="btn btn--secondary"
                      style={{ width: "auto", minWidth: "110px" }}
                      onClick={() => handleApprove(candidate._id)}
                      disabled={busy || candidate.approvalStatus === "approved"}
                    >
                      {busy
                        ? "Please wait..."
                        : candidate.approvalStatus === "approved"
                          ? "Approved"
                          : "Approve"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
