import { BrowserRouter } from "react-router-dom";
import AppProviders from "./app/AppProviders";
import AppRouter from "./app/AppRouter";
import AppErrorBoundary from "./components/common/AppErrorBoundary";
import ScrollToTop from "./components/common/ScrollToTop";

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

// Public homepage.
import "./styles/public-home.css";

// Public demo showcase.
import "./styles/demo-showcase.css";

// Public navbar + homepage animation polish.
import "./styles/public-navbar-polish.css";

// Public/auth final polish.
import "./styles/public-auth-final-polish.css";

// Animated shared error pages.
import "./styles/error-pages.css";

// Final safe override for voter bell + public chat UI.
import "./styles/voter-center-polish.css";

// Final safe override for admin/super-admin light UI.
import "./styles/admin-light-theme.css";

// Final admin responsive/spacing polish.
import "./styles/admin-final-polish.css";

// Final mobile/sidebar hardening.
import "./styles/admin-mobile-hardening.css";

// Final global polish.
import "./styles/app-final-polish.css";

export default function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <AppProviders>
          <ScrollToTop />
          <AppRouter />
        </AppProviders>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}
