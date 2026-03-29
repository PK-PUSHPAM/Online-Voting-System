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
import ResultsAnalyticsPage from "../pages/admin/ResultsAnalyticsPage";
import ManageAdminsPage from "../pages/admin/ManageAdminsPage";
import SystemControlPage from "../pages/admin/SystemControlPage";

import VoterDashboardPage from "../pages/voter/VoterDashboardPage";
import VoterElectionsPage from "../pages/voter/VoterElectionsPage";
import VoterMyVotesPage from "../pages/voter/VoterMyVotesPage";
import VoterProfilePage from "../pages/voter/VoterProfilePage";
import VoterElectionDetailsPage from "../pages/voter/VoterElectionDetailsPage";

import DashboardLayout from "../components/layout/DashboardLayout";
import VoterLayout from "../components/layout/VoterLayout";

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
      <Route path={APP_ROUTES.HOME} element={<HomeRedirect />} />

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
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="elections" element={<ElectionsPage />} />
            <Route path="posts" element={<PostsManagementPage />} />
            <Route path="candidates" element={<CandidatesManagementPage />} />
            <Route path="voters" element={<VotersApprovalPage />} />
            <Route path="results" element={<ResultsAnalyticsPage />} />

            <Route
              element={
                <RoleRoute allowedRoles={["super_admin", "superadmin"]} />
              }
            >
              <Route path="manage-admins" element={<ManageAdminsPage />} />
              <Route path="system" element={<SystemControlPage />} />
            </Route>
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={["voter"]} />}>
          <Route path="/voter" element={<VoterLayout />}>
            <Route index element={<VoterDashboardPage />} />
            <Route path="elections" element={<VoterElectionsPage />} />
            <Route
              path="elections/:electionId"
              element={<VoterElectionDetailsPage />}
            />
            <Route path="my-votes" element={<VoterMyVotesPage />} />
            <Route path="profile" element={<VoterProfilePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
