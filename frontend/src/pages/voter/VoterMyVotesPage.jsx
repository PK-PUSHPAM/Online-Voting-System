import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  CalendarClock,
  CheckCircle2,
  Layers3,
  Search,
  Vote,
} from "lucide-react";
import { voteService } from "../../services/vote.service";
import { getApiErrorMessage } from "../../lib/utils";
import "../../styles/voter.css";
import "../../styles/voter-clean-pages.css";

const VOTES_PAGE_LIMIT = 10;

const tabs = [
  { id: "all", label: "All votes" },
  { id: "recent", label: "Recent" },
  { id: "grouped", label: "By election" },
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

function PaginationControls({ pagination, onPrev, onNext }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="vcp-toolbar">
      <span className="vcp-status-chip">
        Page {pagination.currentPage} of {pagination.totalPages}
      </span>

      <div className="voter-hero__actions">
        <button
          type="button"
          className="voter-secondary-btn"
          onClick={onPrev}
          disabled={!pagination.hasPrevPage}
        >
          Previous
        </button>

        <button
          type="button"
          className="voter-primary-btn"
          onClick={onNext}
          disabled={!pagination.hasNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function VoterMyVotesPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [votes, setVotes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadVotes = async () => {
      try {
        setLoading(true);

        const data = await voteService.getMyVotes({
          page,
          limit: VOTES_PAGE_LIMIT,
        });

        setVotes(Array.isArray(data?.items) ? data.items : []);
        setPagination(data?.pagination || null);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        setVotes([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    };

    loadVotes();
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const searchedVotes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    let baseVotes = [...votes].sort((first, second) => {
      return (
        new Date(second?.createdAt || 0).getTime() -
        new Date(first?.createdAt || 0).getTime()
      );
    });

    if (activeTab === "recent") {
      baseVotes = baseVotes.slice(0, 10);
    }

    if (!keyword) return baseVotes;

    return baseVotes.filter((vote) => {
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
  }, [activeTab, search, votes]);

  const groupedVotes = useMemo(() => {
    const map = new Map();

    for (const vote of searchedVotes) {
      const electionId = vote?.electionId?._id || "unknown";
      const electionTitle = vote?.electionId?.title || "Unknown Election";

      if (!map.has(electionId)) {
        map.set(electionId, {
          electionId,
          electionTitle,
          votes: [],
        });
      }

      map.get(electionId).votes.push(vote);
    }

    return Array.from(map.values());
  }, [searchedVotes]);

  const currentPageElectionCount = useMemo(() => {
    return new Set(votes.map((vote) => vote?.electionId?._id).filter(Boolean))
      .size;
  }, [votes]);

  const handlePrevPage = () => {
    setPage((currentPage) => Math.max(currentPage - 1, 1));
  };

  const handleNextPage = () => {
    setPage((currentPage) => {
      const totalPages = pagination?.totalPages || currentPage;
      return Math.min(currentPage + 1, totalPages);
    });
  };

  return (
    <section className="voter-page vcp-page">
      <section className="vcp-hero vcp-hero--history">
        <div>
          <span className="vcp-eyebrow">Vote history</span>
          <h2>My Votes</h2>
          <p>
            Your vote records are loaded with proper pagination. Each request
            fetches only {VOTES_PAGE_LIMIT} records, which keeps the UI and API
            lighter.
          </p>
        </div>

        <div className="vcp-history-summary">
          <div>
            <Layers3 size={18} />
            <span>Total votes</span>
            <strong>{loading ? "..." : pagination?.totalItems || 0}</strong>
          </div>

          <div>
            <Vote size={18} />
            <span>This page elections</span>
            <strong>{loading ? "..." : currentPageElectionCount}</strong>
          </div>
        </div>
      </section>

      <section className="vcp-toolbar">
        <div className="vcp-tabs" role="tablist" aria-label="Vote history tabs">
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

        <label className="vcp-search-box">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search current page"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      {loading ? (
        <div className="vcp-empty vcp-empty--large">
          Loading your vote records...
        </div>
      ) : activeTab === "grouped" ? (
        groupedVotes.length ? (
          <div className="vcp-grouped-stack">
            {groupedVotes.map((group) => (
              <section key={group.electionId} className="vcp-card">
                <div className="vcp-card-header">
                  <div>
                    <h3>{group.electionTitle}</h3>
                    <p>
                      {group.votes.length} vote record(s) on this current page.
                    </p>
                  </div>

                  <span className="vcp-status-chip">{group.votes.length}</span>
                </div>

                <div className="vcp-vote-list">
                  {group.votes.map((vote) => (
                    <VoteRow key={vote._id} vote={vote} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="vcp-empty vcp-empty--large">
            No grouped vote records found on this page.
          </div>
        )
      ) : searchedVotes.length ? (
        <section className="vcp-card">
          <div className="vcp-card-header">
            <div>
              <h3>{activeTab === "recent" ? "Recent votes" : "All votes"}</h3>
              <p>
                Showing records from page {pagination?.currentPage || page}.
                Search applies to the currently loaded page only.
              </p>
            </div>

            <span className="vcp-status-chip">
              {searchedVotes.length} shown
            </span>
          </div>

          <div className="vcp-vote-list">
            {searchedVotes.map((vote) => (
              <VoteRow key={vote._id} vote={vote} />
            ))}
          </div>
        </section>
      ) : (
        <div className="vcp-empty vcp-empty--large">
          No vote records match your current option or search.
        </div>
      )}

      <PaginationControls
        pagination={pagination}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
      />
    </section>
  );
}

function VoteRow({ vote }) {
  return (
    <article className="vcp-vote-row">
      <div className="vcp-vote-row__icon">
        <CheckCircle2 size={17} />
      </div>

      <div>
        <h4>{vote?.candidateId?.fullName || "Candidate"}</h4>
        <p>
          {vote?.postId?.title || "Post"} •{" "}
          {vote?.candidateId?.partyName || "Independent"}
        </p>
        <small>{vote?.electionId?.title || "Election"}</small>
      </div>

      <span>
        <CalendarClock size={14} />
        {formatDate(vote?.createdAt)}
      </span>
    </article>
  );
}
