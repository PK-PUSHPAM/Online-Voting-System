import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { APP_ROUTES } from "../../lib/routes";

export default function NotFoundPage() {
  return (
    <div className="state-page">
      <SearchX size={64} />
      <h1>Page not found</h1>
      <p>The route you opened does not exist.</p>
      <Link className="state-link" to={APP_ROUTES.LOGIN}>
        Back to app
      </Link>
    </div>
  );
}
