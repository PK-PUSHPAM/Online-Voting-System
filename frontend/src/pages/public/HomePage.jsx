import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BellRing,
  CheckCircle2,
  Crown,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Vote,
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import { APP_ROUTES } from "../../lib/routes";
import "../../styles/public-home.css";

const featureCards = [
  {
    icon: ShieldCheck,
    title: "Role based access",
    text: "Separate dashboards for voters, admins, and super admins with protected routing.",
  },
  {
    icon: FileCheck2,
    title: "Voter verification",
    text: "Admins can review voter identity, approve accounts, and reject invalid profiles.",
  },
  {
    icon: Vote,
    title: "Election workflow",
    text: "Create elections, posts, candidates, and control publish status from admin panel.",
  },
  {
    icon: BarChart3,
    title: "Result analytics",
    text: "View winners, post-wise results, vote distribution, and visual charts.",
  },
  {
    icon: MessageCircle,
    title: "Public chat",
    text: "Live public discussion with admin moderation, delete, block, and unblock controls.",
  },
  {
    icon: BellRing,
    title: "Notifications",
    text: "System notifications and public chat are separated for cleaner voter experience.",
  },
];

const steps = [
  {
    icon: Fingerprint,
    title: "Register securely",
    text: "Voter creates an account with OTP, identity details, and document upload.",
  },
  {
    icon: UserCheck,
    title: "Admin verifies",
    text: "Admin reviews voter details and approves eligible users.",
  },
  {
    icon: Vote,
    title: "Vote in active election",
    text: "Voter can view all elections but vote only when election is active.",
  },
  {
    icon: Crown,
    title: "Results are declared",
    text: "Admins and voters can review final results after election completion.",
  },
];

const stats = [
  { label: "Access roles", value: "3", helper: "Voter, Admin, Super Admin" },
  { label: "Election flow", value: "Full", helper: "Create to result" },
  { label: "Security", value: "JWT", helper: "Protected API access" },
];

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-page__bg-grid" />
      <div className="home-page__glow home-page__glow--one" />
      <div className="home-page__glow home-page__glow--two" />

      <PublicNavbar />

      <section className="home-hero">
        <motion.div
          className="home-hero__copy"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="home-badge">
            <Sparkles size={16} />
            <span>Production-style Online Voting Platform</span>
          </div>

          <h1>
            Secure online voting system for voters, admins, and super admins.
          </h1>

          <p>
            VoteX provides voter verification, election setup, candidate
            management, live chat moderation, notification handling, and result
            analytics in one clean platform.
          </p>

          <div className="home-hero__actions">
            <Link className="home-btn home-btn--primary" to={APP_ROUTES.LOGIN}>
              Login Now
              <ArrowRight size={17} />
            </Link>

            <Link
              className="home-btn home-btn--secondary"
              to={APP_ROUTES.REGISTER}
            >
              Register as Voter
            </Link>
          </div>

          <div className="home-trust-row">
            <span>
              <CheckCircle2 size={15} />
              OTP registration
            </span>
            <span>
              <CheckCircle2 size={15} />
              Admin verification
            </span>
            <span>
              <CheckCircle2 size={15} />
              Secure results
            </span>
          </div>
        </motion.div>

        <motion.div
          className="home-hero__visual"
          initial={{ opacity: 0, x: 34, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="home-preview">
            <div className="home-preview__top">
              <div>
                <span className="home-dot home-dot--red" />
                <span className="home-dot home-dot--yellow" />
                <span className="home-dot home-dot--green" />
              </div>

              <span className="home-preview__pill">
                <LockKeyhole size={13} />
                Secure session
              </span>
            </div>

            <div className="home-preview__body">
              <aside className="home-preview__sidebar">
                <div className="home-preview__brand">
                  <Vote size={18} />
                  <span>VoteX</span>
                </div>

                <div className="home-preview__nav active" />
                <div className="home-preview__nav" />
                <div className="home-preview__nav short" />
                <div className="home-preview__nav" />
              </aside>

              <section className="home-preview__main">
                <div className="home-preview__metric-row">
                  <div />
                  <div />
                  <div />
                </div>

                <div className="home-preview__chart">
                  <span style={{ height: "45%" }} />
                  <span style={{ height: "72%" }} />
                  <span style={{ height: "56%" }} />
                  <span style={{ height: "86%" }} />
                  <span style={{ height: "64%" }} />
                </div>

                <div className="home-preview__list">
                  <div />
                  <div />
                  <div />
                </div>
              </section>
            </div>
          </div>

          <div className="home-floating-card home-floating-card--one">
            <BadgeCheck size={18} />
            <div>
              <strong>Voter approved</strong>
              <span>Verification completed</span>
            </div>
          </div>

          <div className="home-floating-card home-floating-card--two">
            <BarChart3 size={18} />
            <div>
              <strong>Result ready</strong>
              <span>Charts generated</span>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="home-stats">
        {stats.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <p>{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="home-section" id="security">
        <div className="home-section__header">
          <span>Core Features</span>
          <h2>Everything needed for a complete voting workflow.</h2>
          <p>
            The system is not just login and voting. It includes verification,
            administration, candidate approval, notifications, chat moderation,
            and analytics.
          </p>
        </div>

        <div className="home-feature-grid">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <article key={feature.title} className="home-feature-card">
                <div className="home-feature-card__icon">
                  <Icon size={20} />
                </div>

                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-section home-section--split" id="roles">
        <div className="home-section__header home-section__header--left">
          <span>How it works</span>
          <h2>Clear flow from registration to final result.</h2>
          <p>
            Voters do not get direct voting power immediately. Admin
            verification keeps the process controlled and credible.
          </p>

          <Link className="home-btn home-btn--primary" to={APP_ROUTES.REGISTER}>
            Start voter registration
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="home-step-list">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article key={step.title} className="home-step-card">
                <div className="home-step-card__number">{index + 1}</div>

                <div className="home-step-card__icon">
                  <Icon size={19} />
                </div>

                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-cta" id="experience">
        <div>
          <span>Ready for demo</span>
          <h2>Login to access your dashboard.</h2>
          <p>
            Admins manage the platform. Voters view elections, vote in active
            elections, check their vote history, and manage profile details.
          </p>
        </div>

        <div className="home-cta__actions">
          <Link className="home-btn home-btn--primary" to={APP_ROUTES.LOGIN}>
            Sign in
            <ArrowRight size={17} />
          </Link>

          <Link
            className="home-btn home-btn--secondary"
            to={APP_ROUTES.REGISTER}
          >
            Create voter account
          </Link>
        </div>
      </section>
    </main>
  );
}
