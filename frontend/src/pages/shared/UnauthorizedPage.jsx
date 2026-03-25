import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { APP_ROUTES } from "../../lib/routes";

export default function UnauthorizedPage() {
  return (
    <div className="state-page">
      <ShieldX size={64} />
      <h1>Access denied</h1>
      <p>You do not have permission to open this page.</p>
      <Link className="state-link" to={APP_ROUTES.LOGIN}>
        Go to login
      </Link>
    </div>
  );
}
