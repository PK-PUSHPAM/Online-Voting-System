import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import Topbar from "./Topbar";

export default function DashboardLayout() {
  return (
    <div className="dashboard">
      <AdminSidebar />

      <div className="dashboard__main">
        <Topbar />

        <div className="dashboard__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
