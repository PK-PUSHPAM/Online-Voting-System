import { motion } from "framer-motion";
import { ShieldCheck, BarChart3, LockKeyhole, BadgeCheck } from "lucide-react";
import PublicNavbar from "./PublicNavbar";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

export default function AuthLayout({
  title,
  subtitle,
  badge = "Secure Election Platform",
  children,
}) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__bg-grid" />
      <div className="auth-shell__glow auth-shell__glow--one" />
      <div className="auth-shell__glow auth-shell__glow--two" />

      <PublicNavbar />

      <main className="auth-shell__content">
        <motion.section
          className="auth-hero"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="hero-badge">
            <ShieldCheck size={16} />
            <span>{badge}</span>
          </motion.div>

          <motion.h1 variants={itemVariants}>
            Build elections that feel
            <span> trustworthy, premium, and fast.</span>
          </motion.h1>

          <motion.p variants={itemVariants}>
            Role-based dashboards, cookie auth, OTP flows, secure candidate
            management, clean result reporting, and an interface that does not
            look like a rushed college project.
          </motion.p>

          <motion.div variants={itemVariants} className="hero-metrics">
            <div className="hero-metric-card" id="security">
              <div className="hero-metric-card__icon">
                <LockKeyhole size={20} />
              </div>
              <div>
                <span>Security</span>
                <strong>Cookie auth + refresh flow</strong>
              </div>
            </div>

            <div className="hero-metric-card" id="roles">
              <div className="hero-metric-card__icon">
                <BadgeCheck size={20} />
              </div>
              <div>
                <span>Access Model</span>
                <strong>Voter, Admin, Super Admin</strong>
              </div>
            </div>

            <div className="hero-metric-card" id="experience">
              <div className="hero-metric-card__icon">
                <BarChart3 size={20} />
              </div>
              <div>
                <span>Experience</span>
                <strong>Scalable dashboard architecture</strong>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="hero-preview">
            <div className="hero-preview__top">
              <span className="dot dot--red" />
              <span className="dot dot--yellow" />
              <span className="dot dot--green" />
            </div>

            <div className="hero-preview__body">
              <div className="hero-preview__sidebar">
                <div className="preview-block preview-block--lg" />
                <div className="preview-block" />
                <div className="preview-block" />
                <div className="preview-block" />
              </div>

              <div className="hero-preview__main">
                <div className="preview-stat-row">
                  <div className="preview-stat" />
                  <div className="preview-stat" />
                  <div className="preview-stat" />
                </div>
                <div className="preview-chart" />
                <div className="preview-table" />
              </div>
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          className="auth-card"
          initial={{ opacity: 0, x: 28, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          <div className="auth-card__header">
            <p className="auth-card__eyebrow">{badge}</p>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          <div className="auth-card__body">{children}</div>
        </motion.section>
      </main>
    </div>
  );
}
