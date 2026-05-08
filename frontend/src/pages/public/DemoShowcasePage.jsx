import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  BellRing,
  Eye,
  FileCheck2,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Trophy,
  UserCog,
  Users,
  Vote,
} from "lucide-react";
import { APP_ROUTES } from "../../lib/routes";
import PublicNavbar from "../../components/layout/PublicNavbar";
import "../../styles/demo-showcase.css";

const demoCredentials = {
  email: "demo@votex.local",
  mobile: "9999999999",
  password: "Demo@1234",
  accessCode: "DEMO2026",
};

const demoStats = {
  voter: [
    { label: "Available Elections", value: 4, icon: Vote },
    { label: "Votes Cast", value: 2, icon: BadgeCheck },
    { label: "Notifications", value: 7, icon: BellRing },
  ],
  admin: [
    { label: "Pending Voters", value: 18, icon: Users },
    { label: "Candidates", value: 36, icon: FileCheck2 },
    { label: "Active Elections", value: 2, icon: Vote },
  ],
  superAdmin: [
    { label: "Admins", value: 6, icon: UserCog },
    { label: "Audit Logs", value: 124, icon: ShieldCheck },
    { label: "Blocked Chat Users", value: 3, icon: MessageCircle },
  ],
};

const demoElections = [
  {
    title: "Student Council Election 2026",
    status: "Active",
    posts: 5,
    candidates: 18,
    votes: 842,
  },
  {
    title: "Department Representative Vote",
    status: "Upcoming",
    posts: 3,
    candidates: 9,
    votes: 0,
  },
  {
    title: "Hostel Committee Election",
    status: "Ended",
    posts: 4,
    candidates: 12,
    votes: 617,
  },
];

const demoCandidates = [
  {
    name: "Anjali Sharma",
    party: "Progress Group",
    post: "President",
    votes: 328,
    status: "Approved",
  },
  {
    name: "Rohit Kumar",
    party: "Independent",
    post: "Secretary",
    votes: 286,
    status: "Approved",
  },
  {
    name: "Sneha Verma",
    party: "Unity Panel",
    post: "Treasurer",
    votes: 214,
    status: "Pending",
  },
];

const demoAuditLogs = [
  "Super admin updated demo access visibility",
  "Admin approved voter profile",
  "Admin rejected candidate request",
  "Chat user blocked for spam",
];

const tabs = [
  {
    id: "voter",
    label: "Voter Demo",
    icon: Users,
  },
  {
    id: "admin",
    label: "Admin Demo",
    icon: UserCog,
  },
  {
    id: "superAdmin",
    label: "Super Admin Demo",
    icon: ShieldCheck,
  },
];

function DemoMetricCard({ icon: Icon, label, value }) {
  return (
    <article className="demo-metric-card">
      <div className="demo-metric-card__icon">
        <Icon size={20} />
      </div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function DemoChart() {
  const bars = [48, 72, 54, 88, 63, 76];

  return (
    <div className="demo-chart">
      {bars.map((height, index) => (
        <motion.span
          key={height + index}
          style={{ height: `${height}%` }}
          initial={{ scaleY: 0.2, opacity: 0.4 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: index * 0.06, duration: 0.45 }}
        />
      ))}
    </div>
  );
}

export default function DemoShowcasePage() {
  const [activeTab, setActiveTab] = useState("voter");

  const activeStats = useMemo(() => demoStats[activeTab] || [], [activeTab]);

  return (
    <main className="demo-page">
      <div className="demo-page__grid" />
      <div className="demo-page__glow demo-page__glow--one" />
      <div className="demo-page__glow demo-page__glow--two" />

      <PublicNavbar />

      <section className="demo-hero">
        <motion.div
          className="demo-hero__copy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42 }}
        >
          <div className="demo-badge">
            <Eye size={15} />
            Read-only demo mode
          </div>

          <h1>Preview the full system without changing real data.</h1>

          <p>
            Use this demo to show voter, admin, and super admin dashboards with
            fake data only.
          </p>

          <div className="demo-warning">
            <LockKeyhole size={17} />
            <span>
              No create, update, delete, or real vote action is allowed here.
            </span>
          </div>

          <div className="demo-hero__actions">
            <Link className="demo-btn demo-btn--primary" to={APP_ROUTES.LOGIN}>
              <ArrowLeft size={17} />
              Back to Login
            </Link>

            <Link className="demo-btn demo-btn--secondary" to={APP_ROUTES.HOME}>
              Home
            </Link>
          </div>
        </motion.div>

        <motion.aside
          className="demo-credential-card"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.42 }}
        >
          <div className="demo-credential-card__top">
            <ShieldCheck size={20} />
            <div>
              <strong>Demo credentials</strong>
              <span>For presentation only</span>
            </div>
          </div>

          <div className="demo-credential-list">
            <div>
              <span>Email</span>
              <strong>{demoCredentials.email}</strong>
            </div>

            <div>
              <span>Mobile</span>
              <strong>{demoCredentials.mobile}</strong>
            </div>

            <div>
              <span>Password</span>
              <strong>{demoCredentials.password}</strong>
            </div>

            <div>
              <span>Demo Code</span>
              <strong>{demoCredentials.accessCode}</strong>
            </div>
          </div>
        </motion.aside>
      </section>

      <section className="demo-shell">
        <div className="demo-tabs" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "is-active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="demo-dashboard">
          <aside className="demo-sidebar-preview">
            <div className="demo-sidebar-preview__brand">
              <Vote size={18} />
              <span>VoteX</span>
            </div>

            <div className="demo-sidebar-preview__nav active" />
            <div className="demo-sidebar-preview__nav" />
            <div className="demo-sidebar-preview__nav short" />
            <div className="demo-sidebar-preview__nav" />
          </aside>

          <section className="demo-dashboard__main">
            <div className="demo-dashboard__top">
              <div>
                <span>
                  {activeTab === "superAdmin" ? "Super Admin" : activeTab}
                </span>
                <h2>
                  {activeTab === "voter" && "Voter dashboard preview"}
                  {activeTab === "admin" && "Admin dashboard preview"}
                  {activeTab === "superAdmin" && "Super admin control preview"}
                </h2>
              </div>

              <div className="demo-readonly-pill">
                <Eye size={14} />
                Read only
              </div>
            </div>

            <div className="demo-metric-grid">
              {activeStats.map((item) => (
                <DemoMetricCard
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>

            <div className="demo-content-grid">
              <article className="demo-panel">
                <div className="demo-panel__header">
                  <div>
                    <h3>Election overview</h3>
                    <span>Fake election records</span>
                  </div>

                  <Trophy size={19} />
                </div>

                <div className="demo-election-list">
                  {demoElections.map((election) => (
                    <div key={election.title} className="demo-election-row">
                      <div>
                        <strong>{election.title}</strong>
                        <span>
                          {election.posts} posts • {election.candidates}{" "}
                          candidates
                        </span>
                      </div>

                      <div>
                        <b>{election.votes}</b>
                        <small>{election.status}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="demo-panel">
                <div className="demo-panel__header">
                  <div>
                    <h3>Vote chart</h3>
                    <span>Animated preview</span>
                  </div>

                  <BarChart3 size={19} />
                </div>

                <DemoChart />
              </article>

              <article className="demo-panel">
                <div className="demo-panel__header">
                  <div>
                    <h3>Candidate board</h3>
                    <span>Preview data</span>
                  </div>

                  <FileCheck2 size={19} />
                </div>

                <div className="demo-candidate-list">
                  {demoCandidates.map((candidate) => (
                    <div key={candidate.name} className="demo-candidate-row">
                      <div className="demo-candidate-avatar">
                        {candidate.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <strong>{candidate.name}</strong>
                        <span>
                          {candidate.post} • {candidate.party}
                        </span>
                      </div>

                      <small>{candidate.status}</small>
                    </div>
                  ))}
                </div>
              </article>

              <article className="demo-panel">
                <div className="demo-panel__header">
                  <div>
                    <h3>
                      {activeTab === "superAdmin"
                        ? "Audit preview"
                        : "Activity"}
                    </h3>
                    <span>Sample logs</span>
                  </div>

                  <ShieldCheck size={19} />
                </div>

                <div className="demo-log-list">
                  {demoAuditLogs.map((log) => (
                    <div key={log}>
                      <BadgeCheck size={15} />
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
