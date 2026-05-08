import { motion } from "framer-motion";
import {
  BadgeCheck,
  BarChart3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Vote,
} from "lucide-react";
import PublicNavbar from "./PublicNavbar";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const highlights = [
  {
    icon: LockKeyhole,
    title: "Secure sessions",
    text: "Protected role-based access for voters and administrators.",
  },
  {
    icon: UserCheck,
    title: "Verified voters",
    text: "Voter approval flow keeps election access controlled.",
  },
  {
    icon: BarChart3,
    title: "Result analytics",
    text: "Clean result view with charts and winner summaries.",
  },
];

export default function AuthLayout({
  title,
  subtitle,
  badge = "Secure Election Platform",
  children,
}) {
  return (
    <div className="auth-shell auth-shell--light">
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
            <Sparkles size={16} />
            <span>{badge}</span>
          </motion.div>

          <motion.h1 variants={itemVariants}>
            A cleaner way to manage secure online elections.
          </motion.h1>

          <motion.p variants={itemVariants}>
            VoteX brings voter verification, election setup, candidate approval,
            public chat moderation, and result analytics into one controlled
            platform.
          </motion.p>

          <motion.div variants={itemVariants} className="auth-hero__quick-grid">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className="auth-hero__quick-card">
                  <div>
                    <Icon size={19} />
                  </div>

                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </article>
              );
            })}
          </motion.div>

          <motion.div variants={itemVariants} className="hero-preview">
            <div className="hero-preview__top">
              <span className="dot dot--red" />
              <span className="dot dot--yellow" />
              <span className="dot dot--green" />

              <span className="hero-preview__secure">
                <ShieldCheck size={13} />
                Verified access
              </span>
            </div>

            <div className="hero-preview__body">
              <div className="hero-preview__sidebar">
                <div className="hero-preview__brand">
                  <Vote size={17} />
                  <span>VoteX</span>
                </div>

                <div className="preview-block preview-block--active" />
                <div className="preview-block" />
                <div className="preview-block preview-block--short" />
                <div className="preview-block" />
              </div>

              <div className="hero-preview__main">
                <div className="preview-stat-row">
                  <div className="preview-stat">
                    <BadgeCheck size={16} />
                  </div>
                  <div className="preview-stat" />
                  <div className="preview-stat" />
                </div>

                <div className="preview-chart">
                  <span style={{ height: "48%" }} />
                  <span style={{ height: "74%" }} />
                  <span style={{ height: "58%" }} />
                  <span style={{ height: "86%" }} />
                  <span style={{ height: "62%" }} />
                </div>

                <div className="preview-table">
                  <div />
                  <div />
                  <div />
                </div>
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
            <p className="auth-card__eyebrow">
              <ShieldCheck size={14} />
              {badge}
            </p>

            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          <div className="auth-card__body">{children}</div>
        </motion.section>
      </main>
    </div>
  );
}
