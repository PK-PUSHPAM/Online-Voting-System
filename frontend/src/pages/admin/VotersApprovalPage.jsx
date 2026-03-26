import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { userService } from "../../services/user.service";
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

const filterRowStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  alignItems: "center",
};

const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1.5fr 1fr 1fr 1.1fr",
  gap: "12px",
  padding: "0 6px",
  color: "#97a6ba",
  fontSize: "13px",
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1.5fr 1fr 1fr 1.1fr",
  gap: "12px",
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.06)",
  alignItems: "center",
};

const titleStackStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const actionsStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const mutedTextStyle = {
  margin: 0,
  color: "#97a6ba",
  fontSize: "14px",
};

function formatDob(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString();
}

export default function VotersApprovalPage() {
  const [voters, setVoters] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rowActionId, setRowActionId] = useState("");
  const [search, setSearch] = useState("");

  const totalCount = useMemo(
    () => pagination?.totalItems || voters.length || 0,
    [pagination, voters.length],
  );

  const loadPendingVoters = async () => {
    try {
      setLoading(true);

      const data = await userService.getPendingVoters({
        page: 1,
        limit: 20,
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

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    await loadPendingVoters();
  };

  const handleApprove = async (userId) => {
    try {
      setRowActionId(userId);
      await userService.approve(userId, {});
      toast.success("Voter approved successfully");
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
      toast.success("Voter rejected successfully");
      await loadPendingVoters();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRowActionId("");
    }
  };

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>Pending Voters</h1>
          <p style={mutedTextStyle}>
            Review new voter registrations and approve only valid users.
          </p>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <h3 style={{ margin: 0 }}>Approval Queue</h3>
            <p style={mutedTextStyle}>{totalCount} pending voters found</p>
          </div>

          <form onSubmit={handleFilterSubmit} style={filterRowStyle}>
            <input
              className="form-input"
              placeholder="Search by name, email, mobile"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ minWidth: "260px" }}
            />

            <button
              type="submit"
              className="btn btn--secondary"
              style={{ width: "auto" }}
            >
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <p style={mutedTextStyle}>Loading pending voters...</p>
        ) : voters.length === 0 ? (
          <p style={mutedTextStyle}>No pending voters found.</p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div style={tableHeaderStyle}>
              <span>Voter</span>
              <span>Contact</span>
              <span>DOB</span>
              <span>Eligibility</span>
              <span>Actions</span>
            </div>

            {voters.map((user) => {
              const isBusy = rowActionId === user._id;

              return (
                <div key={user._id} style={rowStyle}>
                  <div style={titleStackStyle}>
                    <strong>{user.fullName}</strong>
                    <span style={mutedTextStyle}>
                      ID: {user.internalVoterId || "Not assigned"}
                    </span>
                  </div>

                  <div style={titleStackStyle}>
                    <span>{user.email || "-"}</span>
                    <span style={mutedTextStyle}>
                      {user.mobileNumber || "-"}
                    </span>
                  </div>

                  <div>{formatDob(user.dob)}</div>

                  <div style={titleStackStyle}>
                    <span>
                      Age: {user.ageVerified ? "Verified" : "Not Verified"}
                    </span>
                    <span style={mutedTextStyle}>
                      Mobile:{" "}
                      {user.mobileVerified ? "Verified" : "Not Verified"}
                    </span>
                  </div>

                  <div style={actionsStyle}>
                    <button
                      className="btn btn--primary"
                      style={{ width: "auto", minWidth: "96px" }}
                      onClick={() => handleApprove(user._id)}
                      disabled={isBusy}
                    >
                      {isBusy ? "Please wait..." : "Approve"}
                    </button>

                    <button
                      className="btn btn--secondary"
                      style={{
                        width: "auto",
                        minWidth: "96px",
                        background: "rgba(239,68,68,0.14)",
                        color: "#fca5a5",
                        border: "1px solid rgba(239,68,68,0.25)",
                      }}
                      onClick={() => handleReject(user._id)}
                      disabled={isBusy}
                    >
                      {isBusy ? "Please wait..." : "Reject"}
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
