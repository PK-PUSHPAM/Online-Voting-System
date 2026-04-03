import { useEffect, useMemo, useState } from "react";
import { Briefcase, ListOrdered, Vote } from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import { electionService } from "../../services/election.service";
import { postService } from "../../services/post.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";

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
  const [activeFilter, setActiveFilter] = useState("");
  const [form, setForm] = useState(initialForm);

  const selectedElection = useMemo(
    () => elections.find((item) => item._id === selectedElectionId) || null,
    [elections, selectedElectionId],
  );

  const totalPosts = useMemo(
    () => pagination?.totalItems || posts.length || 0,
    [pagination, posts.length],
  );

  const activePosts = useMemo(
    () => posts.filter((item) => item.isActive).length,
    [posts],
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
        ...(activeFilter === "" ? {} : { isActive: activeFilter === "active" }),
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
  }, [selectedElectionId, activeFilter]);

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
      toast.error("Please select an election first.");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Post title is required.");
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

      toast.success("Post created successfully.");
      setForm(initialForm);
      await loadPosts(selectedElectionId);
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
            <Briefcase size={14} />
            Position structure
          </span>

          <h2>
            Define election posts clearly so ballot structure remains consistent
            and easy to manage.
          </h2>

          <p>
            Posts determine how candidates are organized within an election.
            Clear titles, voting limits, and ordering rules help ensure that the
            ballot remains understandable for both administrators and voters.
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
            <span>Total posts</span>
            <strong>{totalPosts}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Active posts</span>
            <strong>{activePosts}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Current filter</span>
            <strong>{activeFilter || "All"}</strong>
          </div>
        </div>
      </div>

      <div className="admin-crud__grid">
        <div className="admin-crud__panel admin-crud__panel--sticky">
          <div className="admin-crud__panel-header">
            <div>
              <h3>Create post</h3>
              <p>
                Add a structured position or post under the selected election.
              </p>
            </div>
            <span className="admin-crud__panel-badge">02</span>
          </div>

          <form className="admin-crud__form" onSubmit={handleCreate}>
            <div className="form-field">
              <label className="form-label">Election</label>
              <select
                className="admin-crud__select"
                value={selectedElectionId}
                onChange={(event) => setSelectedElectionId(event.target.value)}
                disabled={loadingElections || elections.length === 0}
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

            <InputField
              label="Post Title"
              name="title"
              placeholder="President, General Secretary, Cultural Head"
              value={form.title}
              onChange={handleFormChange}
            />

            <div className="form-field">
              <label className="form-label">Description</label>
              <textarea
                className="admin-crud__textarea"
                name="description"
                placeholder="Provide a short description of the role or responsibility."
                value={form.description}
                onChange={handleFormChange}
              />
            </div>

            <div className="admin-crud__form-grid">
              <InputField
                label="Max Votes Per Voter"
                name="maxVotesPerVoter"
                type="number"
                min="1"
                max="10"
                value={form.maxVotesPerVoter}
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
            </div>

            <div className="admin-crud__switch-row">
              <div className="admin-crud__switch-copy">
                <strong>Mark post as active</strong>
                <span>
                  Inactive posts remain in the system but should not appear in
                  active voting flows.
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

            <Button
              className="admin-crud__submit"
              type="submit"
              loading={createLoading}
            >
              Create Post
            </Button>
          </form>
        </div>

        <div className="admin-crud__panel">
          <div className="admin-crud__toolbar">
            <div className="admin-crud__toolbar-left">
              <h3 style={{ margin: 0 }}>Posts list</h3>
              <span className="admin-crud__meta">{totalPosts} item(s)</span>
            </div>

            <div className="admin-crud__toolbar-right">
              <select
                className="admin-crud__select"
                value={activeFilter}
                onChange={(event) => setActiveFilter(event.target.value)}
                style={{ minWidth: 150 }}
              >
                <option value="">All posts</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>
          </div>

          {!selectedElectionId ? (
            <div className="admin-crud__empty">
              <p>Please select an election to view and manage its posts.</p>
            </div>
          ) : loadingPosts ? (
            <div className="admin-crud__empty">
              <p>Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="admin-crud__empty">
              <p>No posts are available for the selected election.</p>
            </div>
          ) : (
            <div className="admin-crud__list">
              {posts.map((post) => (
                <article key={post._id} className="admin-crud__card">
                  <div className="admin-crud__card-top">
                    <div className="admin-crud__title-stack">
                      <h4>{post.title}</h4>
                      <p>{post.description || "No description provided."}</p>
                    </div>

                    <span
                      className={`admin-crud__status ${
                        post.isActive
                          ? "admin-crud__status--active"
                          : "admin-crud__status--inactive"
                      }`}
                    >
                      {post.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="admin-crud__chips">
                    <span className="admin-crud__chip">
                      <Vote size={14} />
                      Max votes: {post.maxVotesPerVoter}
                    </span>
                    <span className="admin-crud__chip">
                      <ListOrdered size={14} />
                      Display order: {post.displayOrder ?? 0}
                    </span>
                    <span className="admin-crud__chip">
                      Election: {selectedElection?.title || "Unknown"}
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
