import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Home,
  LockKeyhole,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { APP_ROUTES } from "../../lib/routes";
import "../../styles/error-pages.css";

export default function UnauthorizedPage() {
  return (
    <main className="error-page">
      <div className="error-page__grid" />
      <div className="error-page__glow error-page__glow--one" />
      <div className="error-page__glow error-page__glow--two" />

      <motion.section
        className="error-card"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <motion.div
          className="error-orbit"
          animate={{ rotate: 360 }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <span />
          <span />
          <span />
        </motion.div>

        <motion.div
          className="error-icon error-icon--danger"
          initial={{ scale: 0.7, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.16, type: "spring", stiffness: 170 }}
        >
          <ShieldAlert size={34} />
        </motion.div>

        <motion.div
          className="error-badge"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <Sparkles size={14} />
          Access Blocked
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          Unauthorized access
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
        >
          Your account does not have permission to open this page.
        </motion.p>

        <motion.div
          className="error-actions"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link className="error-btn error-btn--primary" to={APP_ROUTES.HOME}>
            <Home size={17} />
            Go Home
          </Link>

          <Link
            className="error-btn error-btn--secondary"
            to={APP_ROUTES.LOGIN}
          >
            <ArrowLeft size={17} />
            Login Again
          </Link>
        </motion.div>

        <motion.div
          className="error-note"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.48 }}
        >
          <LockKeyhole size={15} />
          Protected route
        </motion.div>
      </motion.section>
    </main>
  );
}
