import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowRight,
  CalendarClock,
  Clock3,
  Search,
  ShieldCheck,
  TimerReset,
  Trophy,
  Vote,
} from "lucide-react";
import { voterService } from "../../services/voter.service";
import { APP_ROUTES, buildVoterElectionDetailsRoute } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/voter.css";

const tabs = [
  { id: "all", label: "All elections" },
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "Active now" },
  { id: "ended", label: "Ended" },
  { id: "verified", label: "Verified access" },
];

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function isEndingSoon(value) {
  if (!value) return false;

  const end = new Date(value).getTime();
  if (Number.isNaN(end)) return false;

  const diff = end - Date.now();
  return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 2;
}

function getElectionStatusMeta(election) {
  if (election?.status === "upcoming") {
    return {
      label: "Upcoming",
      className: "status-chip status-chip--amber",
      actionText: "View Details",
      icon: TimerReset,
      actionRoute: buildVoterElectionDetailsRoute(election?._id),
    };
  }

  if (election?.status === "active") {
    return {
      label: isEndingSoon(election?.endDate) ? "Ending soon" : "Open now",
      className: isEndingSoon(election?.endDate)
        ? "status-chip status-chip--amber"
        : "status-chip status-chip--green",
      actionText: "Open Ballot",
      icon: Vote,
      actionRoute: buildVoterElectionDetailsRoute(election?._id),
    };
  }

  if (election?.status === "ended") {
    return {
      label: "Ended",
      className: "status-chip status-chip--violet",
      actionText: "View Result",
      icon: Trophy,
      actionRoute: APP_ROUTES.VOTER_RESULTS,
    };
  }

  return {
    label: "Unavailable",
    className: "status-chip",
    actionText: "View Details",
    icon: Vote,
    actionRoute: buildVoterElectionDetailsRoute(election?._id),
  };
}

export default function VoterElectionsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [elections, setElections] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadElections = async () => {
      try {
        setLoading(true);

        const data = await voterService.getPublishedElections();

        setElections(Array.isArray(data?.elections) ? data.elections : []);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        setElections([]);
      } finally {
        setLoading(false);
      }
    };

    loadElections();
  }, []);

  const electionStats = useMemo(() => {
    return elections.reduce(
      (stats, election) => {
        if (election?.status === "upcoming") {
          stats.upcoming += 1;
        }

        if (election?.status === "active") {
          stats.active += 1;
        }

        if (election?.status === "ended") {
          stats.ended += 1;
        }

        if (election?.allowedVoterType === "verifiedOnly") {
          stats.verified += 1;
        }

        return stats;
      },
      {
        upcoming: 0,
        active: 0,
        ended: 0,
        verified: 0,
      },
    );
  }, [elections]);

  const filteredElections = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return elections
      .filter((election) => {
        if (activeTab === "upcoming") {
          return election?.status === "upcoming";
        }

        if (activeTab === "active") {
          return election?.status === "active";
        }

        if (activeTab === "ended") {
          return election?.status === "ended";
        }

        if (activeTab === "verified") {
          return election?.allowedVoterType === "verifiedOnly";
        }

        return true;
      })
      .filter((election) => {
        if (!keyword) return true;

        return (
          String(election?.title || "")
            .toLowerCase()
            .includes(keyword) ||
          String(election?.description || "")
            .toLowerCase()
            .includes(keyword) ||
          String(election?.status || "")
            .toLowerCase()
            .includes(keyword)
        );
      });
  }, [activeTab, elections, search]);

  return (
    <section className="voter-page voter-page--elections">
      <section className="voter-page-hero voter-page-hero--mint">
        <div>
          <span className="voter-eyebrow">Election centre</span>
          <h2>Published Elections</h2>
          <p>
            Upcoming elections are visible before start time, active elections
            are open for voting, and ended elections are available for final
            result viewing.
          </p>
        </div>

        <div className="vcp-history-summary">
          <div>
            <TimerReset size={18} />
            <span>Upcoming</span>
            <strong>{loading ? "..." : electionStats.upcoming}</strong>
          </div>

          <div>
            <Vote size={18} />
            <span>Active now</span>
            <strong>{loading ? "..." : electionStats.active}</strong>
          </div>

          <div>
            <Trophy size={18} />
            <span>Ended</span>
            <strong>{loading ? "..." : electionStats.ended}</strong>
          </div>
        </div>
      </section>

      <div className="voter-toolbar-card">
        <div
          className="voter-option-tabs"
          role="tablist"
          aria-label="Election options"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="voter-search-box">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search election"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <div className="voter-empty-box voter-empty-box--large">
          Loading published elections...
        </div>
      ) : filteredElections.length ? (
        <div className="voter-clean-election-grid">
          {filteredElections.map((election) => {
            const statusMeta = getElectionStatusMeta(election);
            const StatusIcon = statusMeta.icon;

            return (
              <article
                key={election._id}
                className="voter-clean-card voter-election-card-clean"
              >
                <div className="voter-election-card-clean__top">
                  <span className={statusMeta.className}>
                    {statusMeta.label}
                  </span>

                  <StatusIcon size={20} />
                </div>

                <h3>{election?.title || "Election"}</h3>
                <p>
                  {election?.description ||
                    "No election description is available."}
                </p>

                <div className="voter-election-meta-clean">
                  <div>
                    <CalendarClock size={15} />
                    <span>Starts</span>
                    <strong>{formatDate(election?.startDate)}</strong>
                  </div>

                  <div>
                    <Clock3 size={15} />
                    <span>Ends</span>
                    <strong>{formatDate(election?.endDate)}</strong>
                  </div>

                  <div>
                    <ShieldCheck size={15} />
                    <span>Access</span>
                    <strong>
                      {election?.allowedVoterType === "all"
                        ? "All voters"
                        : "Verified only"}
                    </strong>
                  </div>
                </div>

                {election?.status === "upcoming" ? (
                  <div className="voter-upcoming-note">
                    This election has not started yet. You can preview posts and
                    candidates from the details page.
                  </div>
                ) : null}

                {election?.status === "ended" ? (
                  <div className="voter-ended-note">
                    This election has ended. Voting is closed and final result
                    is available.
                  </div>
                ) : null}

                <div className="voter-election-card-clean__footer">
                  <span>
                    {election?.status === "active"
                      ? "Voting available"
                      : election?.status === "ended"
                        ? "Final result available"
                        : "Preview available"}
                  </span>

                  <Link
                    to={statusMeta.actionRoute}
                    className={
                      election?.status === "ended"
                        ? "voter-clean-button voter-clean-button--result"
                        : "voter-clean-button"
                    }
                  >
                    {statusMeta.actionText}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="voter-empty-box voter-empty-box--large">
          No election found for this filter.
        </div>
      )}
    </section>
  );
}
