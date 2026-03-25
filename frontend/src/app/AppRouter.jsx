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

function AdminPlaceholder() {
  return (
    <div className="dashboard-placeholder">
      <h1>Admin Dashboard</h1>
      <p>Next batch me actual admin layout + summary cards banayenge.</p>
    </div>
  );
}

function VoterPlaceholder() {
  return (
    <div className="dashboard-placeholder">
      <h1>Voter Dashboard</h1>
      <p>Next batch me active elections + vote flow banayenge.</p>
    </div>
  );
}

function HomeRedirect() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (!user) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }

  if (user.role === "admin" || user.role === "super_admin") {
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
        <Route element={<RoleRoute allowedRoles={["admin", "super_admin"]} />}>
          <Route
            path={APP_ROUTES.ADMIN_DASHBOARD}
            element={<AdminPlaceholder />}
          />
        </Route>

        <Route element={<RoleRoute allowedRoles={["voter"]} />}>
          <Route
            path={APP_ROUTES.VOTER_DASHBOARD}
            element={<VoterPlaceholder />}
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
