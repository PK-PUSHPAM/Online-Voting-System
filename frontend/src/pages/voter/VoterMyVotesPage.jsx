import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { CheckCircle2, Layers3, Vote, CalendarClock } from "lucide-react";
import { voteService } from "../../services/vote.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/voter.css";

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

export default function VoterMyVotesPage() {
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadVotes = async () => {
      try {
        setLoading(true);
        const data = await voteService.getMyVotes({ page: 1, limit: 100 });
        setVotes(Array.isArray(data?.items) ? data.items : []);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        setVotes([]);
      } finally {
        setLoading(false);
      }
    };

    loadVotes();
  }, []);

  const filteredVotes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return votes;

    return votes.filter((vote) => {
      return (
        String(vote?.candidateId?.fullName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(vote?.postId?.title || "")
          .toLowerCase()
          .includes(keyword) ||
        String(vote?.electionId?.title || "")
          .toLowerCase()
          .includes(keyword) ||
        String(vote?.candidateId?.partyName || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [votes, search]);

  const uniqueElectionCount = useMemo(() => {
    return (
      new Set(
        filteredVotes.map((item) => item?.electionId?._id).filter(Boolean),
      ).size || 0
    );
  }, [filteredVotes]);

  return (
    <section className="voter-page">
      <section className="voter-panel voter-panel--heroish">
        <div className="voter-section-heading">
          <div>
            <h2>My Votes</h2>
            <p>
              Review the vote records associated with your account, including
              the selected candidate, post, election, and submission time.
            </p>
          </div>

          <div className="voter-search-wrap">
            <input
              type="text"
              className="voter-search-input"
              placeholder="Search by candidate, post, election, or party"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="voter-summary-strip">
          <div className="voter-summary-item">
            <Layers3 size={18} />
            <div>
              <span>Total Vote Records</span>
              <strong>{loading ? "..." : votes.length}</strong>
            </div>
          </div>

          <div className="voter-summary-item">
            <Vote size={18} />
            <div>
              <span>Filtered Results</span>
              <strong>{loading ? "..." : filteredVotes.length}</strong>
            </div>
          </div>

          <div className="voter-summary-item">
            <CalendarClock size={18} />
            <div>
              <span>Unique Elections</span>
              <strong>{loading ? "..." : uniqueElectionCount}</strong>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="voter-empty-state voter-empty-state--lg">
          Loading your vote records...
        </div>
      ) : filteredVotes.length ? (
        <div className="voter-votes-list">
          {filteredVotes.map((vote) => (
            <article key={vote._id} className="voter-vote-card">
              <div className="voter-vote-card__icon">
                <CheckCircle2 size={18} />
              </div>

              <div className="voter-vote-card__content">
                <div className="voter-vote-card__top">
                  <h3>{vote?.candidateId?.fullName || "Candidate"}</h3>
                  <span className="voter-tag voter-tag--success">Recorded</span>
                </div>

                <div className="voter-vote-card__grid">
                  <div>
                    <span>Election</span>
                    <strong>{vote?.electionId?.title || "-"}</strong>
                  </div>

                  <div>
                    <span>Post</span>
                    <strong>{vote?.postId?.title || "-"}</strong>
                  </div>

                  <div>
                    <span>Party</span>
                    <strong>
                      {vote?.candidateId?.partyName || "Independent"}
                    </strong>
                  </div>

                  <div>
                    <span>Voted At</span>
                    <strong>{formatDate(vote?.createdAt)}</strong>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="voter-empty-state voter-empty-state--lg">
          No vote records match your current search.
        </div>
      )}
    </section>
  );
}
