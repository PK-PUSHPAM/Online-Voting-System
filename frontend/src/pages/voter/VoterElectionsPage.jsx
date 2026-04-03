import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowRight,
  CalendarClock,
  Clock3,
  ShieldCheck,
  Vote,
} from "lucide-react";
import { voterService } from "../../services/voter.service";
import { buildVoterElectionDetailsRoute } from "../../lib/routes";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/voter.css";

const formatDate = (value) => {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
};

export default function VoterElectionsPage() {
  const [loading, setLoading] = useState(true);
  const [elections, setElections] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadElections = async () => {
      try {
        setLoading(true);
        const data = await voterService.getActiveElections();
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

  const filteredElections = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return elections;

    return elections.filter((election) => {
      return (
        String(election?.title || "")
          .toLowerCase()
          .includes(keyword) ||
        String(election?.description || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [elections, search]);

  return (
    <section className="voter-page">
      <section className="voter-panel voter-panel--heroish">
        <div className="voter-section-heading">
          <div>
            <h2>Active Elections</h2>
            <p>
              Browse the elections that are currently open and available to your
              account. Use search to quickly locate a specific election.
            </p>
          </div>

          <div className="voter-search-wrap">
            <input
              type="text"
              className="voter-search-input"
              placeholder="Search active elections"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="voter-summary-strip">
          <div className="voter-summary-item">
            <Vote size={18} />
            <div>
              <span>Total Active Elections</span>
              <strong>{loading ? "..." : elections.length}</strong>
            </div>
          </div>

          <div className="voter-summary-item">
            <ShieldCheck size={18} />
            <div>
              <span>Filtered Results</span>
              <strong>{loading ? "..." : filteredElections.length}</strong>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="voter-empty-state voter-empty-state--lg">
          Loading active elections...
        </div>
      ) : filteredElections.length ? (
        <div className="voter-election-grid">
          {filteredElections.map((election) => (
            <article key={election._id} className="voter-election-card">
              <div className="voter-election-card__top">
                <span className="voter-election-card__badge">
                  <Vote size={14} />
                  Active Election
                </span>

                <span className="voter-tag">Published</span>
              </div>

              <div className="voter-election-card__body">
                <h3>{election.title}</h3>
                <p>
                  {election.description ||
                    "No election description is available at the moment."}
                </p>
              </div>

              <div className="voter-election-card__meta">
                <span>
                  <CalendarClock size={15} />
                  Starts: {formatDate(election.startDate)}
                </span>

                <span>
                  <Clock3 size={15} />
                  Ends: {formatDate(election.endDate)}
                </span>

                <span>
                  <ShieldCheck size={15} />
                  Access:{" "}
                  {election.allowedVoterType === "all"
                    ? "All voters"
                    : "Verified only"}
                </span>
              </div>

              <div className="voter-election-card__footer">
                <Link
                  className="voter-primary-btn voter-primary-btn--full"
                  to={buildVoterElectionDetailsRoute(election._id)}
                >
                  Open Election
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="voter-empty-state voter-empty-state--lg">
          No active elections match your current search.
        </div>
      )}
    </section>
  );
}
