import { BrowserRouter } from "react-router-dom";
import AppProviders from "./app/AppProviders";
import AppRouter from "./app/AppRouter";

// Base CSS files
import "./styles/dashboard.css";
import "./styles/voter.css";
import "./styles/auth-pages.css";
import "./styles/admin-crud.css";
import "./styles/manage-admins.css";
import "./styles/register-page.css";
import "./styles/results-analytics.css";
import "./styles/system-control.css";
import "./styles/voter-clean-pages.css";

// Final safe override for voter bell + public chat UI.
import "./styles/voter-center-polish.css";

// Final safe override for admin/super-admin light UI.
// Keep this LAST so it overrides old dark admin theme and inline-heavy styles.
import "./styles/admin-light-theme.css";

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </BrowserRouter>
  );
}
