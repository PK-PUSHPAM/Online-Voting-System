import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowRight, Vote, CalendarClock, ShieldCheck } from "lucide-react";
import { voterService } from "../../services/voter.service";
import { getApiErrorMessage } from "../../lib/utils";

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function VoterElectionsPage() {
  const [loading, setLoading] = useState(true);
  const [elections, setElections] = useState([]);

  useEffect(() => {
    const loadElections = async () => {
      try {
        setLoading(true);
        const data = await voterService.getActiveElections();
        setElections(Array.isArray(data?.elections) ? data.elections : []);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadElections();
  }, []);

  return (
    <section className="voter-page">
      <div className="voter-section-heading">
        <div>
          <h2>Active Elections</h2>
          <p>
            Ye list backend se filtered aa rahi hai. Matlab yahan wahi election
            dikhne chahiye jo active aur allowed hain.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="voter-empty-state voter-empty-state--lg">
          Loading active elections...
        </div>
      ) : elections.length ? (
        <div className="voter-election-grid">
          {elections.map((election) => (
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
                    "No election description is available yet."}
                </p>
              </div>

              <div className="voter-election-card__meta">
                <span>
                  <CalendarClock size={15} />
                  Starts: {formatDate(election.startDate)}
                </span>

                <span>
                  <ShieldCheck size={15} />
                  Ends: {formatDate(election.endDate)}
                </span>
              </div>

              <Link
                className="voter-primary-btn voter-primary-btn--full"
                to={`/voter/elections/${election._id}`}
              >
                Open Election
                <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="voter-empty-state voter-empty-state--lg">
          No active election is available for your account.
        </div>
      )}
    </section>
  );
}
