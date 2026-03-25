import { Link } from "react-router-dom";
import { ShieldCheck, Vote, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { APP_ROUTES } from "../../lib/routes";

export default function PublicNavbar() {
  return (
    <motion.header
      className="public-nav"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="public-nav__left">
        <Link to={APP_ROUTES.HOME} className="brand">
          <span className="brand__icon">
            <Vote size={18} />
          </span>
          <div className="brand__text">
            <strong>VoteX</strong>
            <span>Online Voting System</span>
          </div>
        </Link>
      </div>

      <nav className="public-nav__center">
        <a href="#security">Security</a>
        <a href="#roles">Roles</a>
        <a href="#experience">Experience</a>
      </nav>

      <div className="public-nav__right">
        <Link
          to={APP_ROUTES.LOGIN}
          className="nav-link-btn nav-link-btn--ghost"
        >
          Sign in
        </Link>
        <Link
          to={APP_ROUTES.REGISTER}
          className="nav-link-btn nav-link-btn--primary"
        >
          Get started
          <ArrowRight size={16} />
        </Link>
      </div>
    </motion.header>
  );
}
