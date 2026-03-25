import { Navigate, Outlet } from "react-router-dom";
import Loader from "../components/common/Loader";
import { useAuth } from "../hooks/useAuth";
import { APP_ROUTES } from "../lib/routes";

export default function RoleRoute({ allowedRoles = [] }) {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <Loader fullScreen label="Checking access..." />;
  }

  if (!user) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={APP_ROUTES.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
}
