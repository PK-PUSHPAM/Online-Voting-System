import { useEffect, useState } from "react";
import { adminService } from "../../services/admin.service";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminService.getDashboardSummary();
        setData(res);
      } catch (err) {
        console.error(err);
      }
    };

    fetch();
  }, []);

  if (!data) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div className="dashboard-grid">
      <div className="card">
        <h4>Total Users</h4>
        <p>{data.totalUsers}</p>
      </div>

      <div className="card">
        <h4>Total Elections</h4>
        <p>{data.totalElections}</p>
      </div>

      <div className="card">
        <h4>Total Votes</h4>
        <p>{data.totalVotes}</p>
      </div>

      <div className="card">
        <h4>Pending Approvals</h4>
        <p>{data.pendingVoters}</p>
      </div>
    </div>
  );
}
