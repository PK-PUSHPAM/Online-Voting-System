import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { electionService } from "../../services/election.service";
import { postService } from "../../services/post.service";
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

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "1.7fr 1fr 0.8fr 0.8fr",
  gap: "12px",
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.06)",
  alignItems: "center",
};

const headerRowStyle = {
  display: "grid",
  gridTemplateColumns: "1.7fr 1fr 0.8fr 0.8fr",
  gap: "12px",
  padding: "0 6px",
  color: "#97a6ba",
  fontSize: "13px",
};

const mutedStyle = {
  margin: 0,
  color: "#97a6ba",
  fontSize: "14px",
};

const initialForm = {
  title: "",
  description: "",
  maxVotesPerVoter: 1,
  displayOrder: 0,
  isActive: true,
};

export default function PostsManagementPage() {
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loadingElections, setLoadingElections] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState(initialForm);

  const totalPosts = useMemo(
    () => pagination?.totalItems || posts.length || 0,
    [pagination, posts.length],
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
      setPagination(null);
      return;
    }

    try {
      setLoadingPosts(true);
      const data = await postService.getByElection(electionId, {
        page: 1,
        limit: 50,
      });

      setPosts(Array.isArray(data?.items) ? data.items : []);
      setPagination(data?.pagination || null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setPosts([]);
      setPagination(null);
    } finally {
      setLoadingPosts(false);
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

    if (!form.title.trim()) {
      toast.error("Post title is required");
      return;
    }

    try {
      setCreateLoading(true);

      await postService.create(selectedElectionId, {
        title: form.title.trim(),
        description: form.description.trim(),
        maxVotesPerVoter: Number(form.maxVotesPerVoter),
        displayOrder: Number(form.displayOrder),
        isActive: form.isActive,
      });

      toast.success("Post created successfully");
      setForm(initialForm);
      await loadPosts(selectedElectionId);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>Posts Management</h1>
          <p style={mutedStyle}>
            Create and organize positions for each election.
          </p>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Select Election</h3>

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
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Create Post</h3>

        <form className="auth-form auth-form--grid" onSubmit={handleCreate}>
          <div className="form-field">
            <label className="form-label">Post Title</label>
            <input
              className="form-input"
              name="title"
              placeholder="President"
              value={form.title}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Max Votes Per Voter</label>
            <input
              className="form-input"
              type="number"
              min="1"
              max="10"
              name="maxVotesPerVoter"
              value={form.maxVotesPerVoter}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              name="description"
              placeholder="Describe this post"
              value={form.description}
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
            {createLoading ? "Creating..." : "Create Post"}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <h3 style={{ margin: 0 }}>Posts List</h3>
            <p style={mutedStyle}>{totalPosts} posts found</p>
          </div>
        </div>

        {!selectedElectionId ? (
          <p style={mutedStyle}>Select an election to view posts.</p>
        ) : loadingPosts ? (
          <p style={mutedStyle}>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p style={mutedStyle}>No posts found for this election.</p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div style={headerRowStyle}>
              <span>Post</span>
              <span>Votes Limit</span>
              <span>Order</span>
              <span>Status</span>
            </div>

            {posts.map((post) => (
              <div key={post._id} style={rowStyle}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <strong>{post.title}</strong>
                  <span style={mutedStyle}>
                    {post.description || "No description"}
                  </span>
                </div>

                <div>{post.maxVotesPerVoter ?? 1}</div>
                <div>{post.displayOrder ?? 0}</div>
                <div>{post.isActive ? "Active" : "Inactive"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
