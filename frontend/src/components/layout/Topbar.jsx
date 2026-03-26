import { useAuth } from "../../hooks/useAuth";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <div className="topbar">
      <div>
        <h3>Admin Dashboard</h3>
        <p>Overview of system activity</p>
      </div>

      <div className="topbar__right">
        <span>{user?.fullName}</span>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
