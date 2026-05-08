import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Home,
  LogIn,
  Menu,
  ShieldCheck,
  UserPlus,
  Vote,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { APP_ROUTES } from "../../lib/routes";
import "../../styles/public-navbar-polish.css";

function getDashboardRoute(user) {
  const role = String(user?.role || "").toLowerCase();

  if (role === "admin" || role === "super_admin" || role === "superadmin") {
    return APP_ROUTES.ADMIN_DASHBOARD;
  }

  if (role === "voter") {
    return APP_ROUTES.VOTER_DASHBOARD;
  }

  return APP_ROUTES.LOGIN;
}

export default function PublicNavbar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoggedIn = Boolean(user?._id || user?.id);
  const dashboardRoute = getDashboardRoute(user);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className="public-nav public-nav--polished">
      <Link className="brand brand--polished" to={APP_ROUTES.HOME}>
        <div className="brand__mark">
          <Vote size={19} />
        </div>

        <div className="brand__text">
          <strong>VoteX</strong>
          <span>Online Voting</span>
        </div>
      </Link>

      <nav className="public-nav__center public-nav__center--polished">
        <a href="/#security">Features</a>
        <a href="/#roles">Workflow</a>
        <a href="/#experience">Demo</a>
      </nav>

      <div className="public-nav__actions">
        {isLoggedIn ? (
          <Link
            className="nav-link-btn nav-link-btn--ghost"
            to={dashboardRoute}
          >
            <BarChart3 size={16} />
            Dashboard
          </Link>
        ) : (
          <>
            <Link
              className="nav-link-btn nav-link-btn--ghost"
              to={APP_ROUTES.LOGIN}
            >
              <LogIn size={16} />
              Login
            </Link>

            <Link
              className="nav-link-btn nav-link-btn--primary"
              to={APP_ROUTES.REGISTER}
            >
              Register
              <ArrowRight size={16} />
            </Link>
          </>
        )}

        <button
          type="button"
          className="public-nav__menu-btn"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="public-mobile-menu">
          <div className="public-mobile-menu__top">
            <div>
              <strong>VoteX</strong>
              <span>Secure voting platform</span>
            </div>

            <button
              type="button"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="public-mobile-menu__links">
            <NavLink to={APP_ROUTES.HOME} onClick={closeMobileMenu}>
              <Home size={16} />
              Home
            </NavLink>

            <a href="/#security" onClick={closeMobileMenu}>
              <ShieldCheck size={16} />
              Features
            </a>

            <a href="/#roles" onClick={closeMobileMenu}>
              <Vote size={16} />
              Workflow
            </a>
          </div>

          <div className="public-mobile-menu__actions">
            {isLoggedIn ? (
              <Link
                className="nav-link-btn nav-link-btn--primary"
                to={dashboardRoute}
                onClick={closeMobileMenu}
              >
                Open Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  className="nav-link-btn nav-link-btn--ghost"
                  to={APP_ROUTES.LOGIN}
                  onClick={closeMobileMenu}
                >
                  <LogIn size={16} />
                  Login
                </Link>

                <Link
                  className="nav-link-btn nav-link-btn--primary"
                  to={APP_ROUTES.REGISTER}
                  onClick={closeMobileMenu}
                >
                  <UserPlus size={16} />
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
