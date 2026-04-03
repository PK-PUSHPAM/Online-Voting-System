import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import { userService } from "../../services/user.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/admin-crud.css";

const formatDob = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

export default function VotersApprovalPage() {
  const [voters, setVoters] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rowActionId, setRowActionId] = useState("");
  const [search, setSearch] = useState("");

  const totalPending = useMemo(
    () => pagination?.totalItems || voters.length || 0,
    [pagination, voters.length],
  );

  const mobileVerifiedCount = useMemo(
    () => voters.filter((item) => item.mobileVerified).length,
    [voters],
  );

  const ageVerifiedCount = useMemo(
    () => voters.filter((item) => item.ageVerified).length,
    [voters],
  );

  const loadPendingVoters = async () => {
    try {
      setLoading(true);

      const data = await userService.getPendingVoters({
        page: 1,
        limit: 50,
        ...(search.trim() ? { search: search.trim() } : {}),
      });

      setVoters(Array.isArray(data?.items) ? data.items : []);
      setPagination(data?.pagination || null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setVoters([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingVoters();
  }, []);

  const handleApprove = async (userId) => {
    try {
      setRowActionId(userId);
      await userService.approve(userId, {});
      toast.success("Voter approved successfully.");
      await loadPendingVoters();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRowActionId("");
    }
  };

  const handleReject = async (userId) => {
    try {
      setRowActionId(userId);
      await userService.reject(userId, {});
      toast.success("Voter rejected successfully.");
      await loadPendingVoters();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRowActionId("");
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await loadPendingVoters();
  };

  return (
    <section className="admin-crud">
      <div className="admin-crud__hero">
        <div className="admin-crud__hero-copy">
          <span className="admin-crud__eyebrow">
            <Users size={14} />
            Verification queue
          </span>

          <h2>
            Review pending voter registrations and approve only accounts that
            meet verification requirements.
          </h2>

          <p>
            This queue should help administrators validate voter details quickly
            and consistently. Review identity fields, verification flags, and
            account readiness before approving access to the voting system.
          </p>
        </div>

        <div className="admin-crud__hero-grid">
          <div className="admin-crud__hero-stat">
            <span>Total pending</span>
            <strong>{totalPending}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Mobile verified</span>
            <strong>{mobileVerifiedCount}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Age verified</span>
            <strong>{ageVerifiedCount}</strong>
          </div>
          <div className="admin-crud__hero-stat">
            <span>Search state</span>
            <strong>{search.trim() || "All"}</strong>
          </div>
        </div>
      </div>

      <div className="admin-crud__panel">
        <div className="admin-crud__toolbar">
          <div className="admin-crud__toolbar-left">
            <h3 style={{ margin: 0 }}>Pending voters</h3>
            <span className="admin-crud__meta">{totalPending} item(s)</span>
          </div>

          <form className="admin-crud__toolbar-right" onSubmit={handleSearch}>
            <InputField
              className="admin-crud__search"
              placeholder="Search by voter name, email, or mobile"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <Button type="submit" variant="secondary" loading={loading}>
              Search
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="admin-crud__empty">
            <p>Loading pending voters...</p>
          </div>
        ) : voters.length === 0 ? (
          <div className="admin-crud__empty">
            <p>No pending voters are available for the current search.</p>
          </div>
        ) : (
          <div className="admin-crud__list">
            {voters.map((user) => {
              const isBusy = rowActionId === user._id;

              return (
                <article key={user._id} className="admin-crud__card">
                  <div className="admin-crud__card-top">
                    <div className="admin-crud__title-stack">
                      <h4>{user.fullName}</h4>
                      <p>ID: {user.internalVoterId || "Not assigned yet"}</p>
                    </div>

                    <span className="admin-crud__status admin-crud__status--pending">
                      Pending
                    </span>
                  </div>

                  <div className="admin-crud__chips">
                    <span className="admin-crud__chip">
                      {user.email || "No email"}
                    </span>
                    <span className="admin-crud__chip">
                      {user.mobileNumber || "No mobile number"}
                    </span>
                    <span className="admin-crud__chip">
                      <Clock3 size={14} />
                      DOB: {formatDob(user.dob)}
                    </span>
                    <span className="admin-crud__chip">
                      <ShieldCheck size={14} />
                      Mobile:{" "}
                      {user.mobileVerified ? "Verified" : "Not verified"}
                    </span>
                    <span className="admin-crud__chip">
                      <CheckCircle2 size={14} />
                      Age: {user.ageVerified ? "Verified" : "Not verified"}
                    </span>
                  </div>

                  <div className="admin-crud__actions">
                    <Button
                      variant="primary"
                      onClick={() => handleApprove(user._id)}
                      disabled={isBusy}
                    >
                      {isBusy ? "Please wait..." : "Approve"}
                    </Button>

                    <Button
                      variant="danger"
                      onClick={() => handleReject(user._id)}
                      disabled={isBusy}
                    >
                      {isBusy ? "Please wait..." : "Reject"}
                    </Button>
                  </div>

                  {(!user.mobileVerified || !user.ageVerified) && (
                    <p
                      className="admin-crud__inline-note"
                      style={{ marginTop: 12 }}
                    >
                      <XCircle
                        size={14}
                        style={{
                          display: "inline",
                          verticalAlign: "middle",
                          marginRight: 6,
                        }}
                      />
                      This account still has incomplete verification flags.
                      Review carefully before approval.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
