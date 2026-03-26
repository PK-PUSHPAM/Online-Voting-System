import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import OtpLoginPage from "../pages/auth/OtpLoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import UnauthorizedPage from "../pages/shared/UnauthorizedPage";
import NotFoundPage from "../pages/shared/NotFoundPage";

import ProtectedRoute from "../routes/ProtectedRoute";
import RoleRoute from "../routes/RoleRoute";

import { APP_ROUTES } from "../lib/routes";
import { useAuth } from "../hooks/useAuth";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import ElectionsPage from "../pages/admin/ElectionsPage";
import VotersApprovalPage from "../pages/admin/VotersApprovalPage";
import PostsManagementPage from "../pages/admin/PostsManagementPage";
import CandidatesManagementPage from "../pages/admin/CandidatesManagementPage";

import DashboardLayout from "../components/layout/DashboardLayout";

function HomeRedirect() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) return null;

  if (!user) return <Navigate to={APP_ROUTES.LOGIN} replace />;

  const normalizedRole = String(user?.role || "").toLowerCase();

  if (
    normalizedRole === "admin" ||
    normalizedRole === "super_admin" ||
    normalizedRole === "superadmin"
  ) {
    return <Navigate to={APP_ROUTES.ADMIN_DASHBOARD} replace />;
  }

  return <Navigate to={APP_ROUTES.VOTER_DASHBOARD} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={APP_ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={APP_ROUTES.OTP_LOGIN} element={<OtpLoginPage />} />
      <Route
        path={APP_ROUTES.FORGOT_PASSWORD}
        element={<ForgotPasswordPage />}
      />
      <Route path={APP_ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <RoleRoute allowedRoles={["admin", "super_admin", "superadmin"]} />
          }
        >
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/elections" element={<ElectionsPage />} />
            <Route path="/admin/posts" element={<PostsManagementPage />} />
            <Route
              path="/admin/candidates"
              element={<CandidatesManagementPage />}
            />
            <Route path="/admin/voters" element={<VotersApprovalPage />} />
          </Route>
        </Route>

        <Route
          path={APP_ROUTES.VOTER_DASHBOARD}
          element={
            <div style={{ padding: 40 }}>Voter Dashboard (next phase)</div>
          }
        />
      </Route>

      <Route path="/admin/manage-admins" element={<div>Manage Admins</div>} />
      <Route path="/admin/system" element={<div>System Control</div>} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
