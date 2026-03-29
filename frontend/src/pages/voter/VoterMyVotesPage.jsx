import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { CheckCircle2, Vote, Layers3 } from "lucide-react";
import { voteService } from "../../services/vote.service";
import { getApiErrorMessage } from "../../lib/utils";

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function VoterMyVotesPage() {
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    const loadVotes = async () => {
      try {
        setLoading(true);
        const data = await voteService.getMyVotes({ page: 1, limit: 100 });
        setVotes(Array.isArray(data?.items) ? data.items : []);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadVotes();
  }, []);

  return (
    <section className="voter-page">
      <div className="voter-section-heading">
        <div>
          <h2>My Votes</h2>
          <p>
            Ye page personal audit trail hai. Yahin se voter ko samajh aana
            chahiye ki kis post me kis candidate ko vote diya tha.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="voter-empty-state voter-empty-state--lg">
          Loading your vote records...
        </div>
      ) : votes.length ? (
        <div className="voter-votes-list">
          {votes.map((vote) => (
            <article key={vote._id} className="voter-vote-card">
              <div className="voter-vote-card__icon">
                <CheckCircle2 size={18} />
              </div>

              <div className="voter-vote-card__content">
                <div className="voter-vote-card__top">
                  <h3>{vote?.candidateId?.fullName || "Candidate"}</h3>
                  <span className="voter-tag">Recorded</span>
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
          <Vote size={18} />
          No vote record found yet.
        </div>
      )}

      {!loading && votes.length > 0 && (
        <section className="voter-panel">
          <div className="voter-panel__header">
            <div>
              <h3>Quick Summary</h3>
              <p>Simple count, no nonsense.</p>
            </div>
          </div>

          <div className="voter-summary-strip">
            <div className="voter-summary-item">
              <Layers3 size={18} />
              <div>
                <span>Total Vote Records</span>
                <strong>{votes.length}</strong>
              </div>
            </div>

            <div className="voter-summary-item">
              <Vote size={18} />
              <div>
                <span>Unique Elections</span>
                <strong>
                  {new Set(
                    votes.map((item) => item?.electionId?._id).filter(Boolean),
                  ).size || 0}
                </strong>
              </div>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
