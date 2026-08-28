import * as React from "react";
import type { DashboardTab } from "../types";
import { SearchInput } from "../components/ui/SearchInput";
import { Pagination } from "../components/ui/Pagination";
import { EmailTable } from "../components/emails/EmailTable";
import { LoadingState, ErrorState, EmptyState } from "../components/emails/EmailStates";
import { api, ApiError, type EmailListItem } from "../services/api";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

type Props = {
  activeTab: DashboardTab;
  onCompose: () => void;
};

function FilterIcon(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M2 4h12L9.5 8.5V13L6.5 11.5V8.5L2 4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M13.5 8A5.5 5.5 0 1 1 11 .5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 2.5V5H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DashboardPage({ activeTab, onCompose }: Props): React.JSX.Element {
  const [query, setQuery] = React.useState("");
  const debouncedQ = useDebouncedValue(query, 350);
  const [page, setPage] = React.useState(1);
  const limit = 10;

  const [emails, setEmails] = React.useState<EmailListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchIdRef = React.useRef(0);

  // Reset page when tab or debounced search changes
  React.useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedQ]);

  const fetchEmails = React.useCallback(async () => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const status = activeTab === "scheduled" ? "scheduled" : "sent";
      const q = debouncedQ.trim() ? debouncedQ.trim() : undefined;
      const res = await api.getEmails({ status, q, page, limit });
      if (id !== fetchIdRef.current) return;
      setEmails(res.emails);
      setTotal(res.total);
    } catch (e) {
      if (id !== fetchIdRef.current) return;
      const err = e instanceof ApiError ? e : new Error(e instanceof Error ? e.message : "Failed to load emails");
      // 401 would be handled by auth layer in later phases; surface as error for now but keep UX friendly
      if (err instanceof ApiError && err.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError(err.message);
      }
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  }, [activeTab, debouncedQ, page, limit]);

  React.useEffect(() => {
    void fetchEmails();
  }, [fetchEmails]);

  const handleRetry = React.useCallback(() => {
    void fetchEmails();
  }, [fetchEmails]);

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      {/* Search bar */}
      <div className="px-4 lg:px-6 py-3 flex items-center gap-3 border-b border-[#f1f5f9] lg:border-none">
        <SearchInput
          placeholder={activeTab === "scheduled" ? "Search scheduled emails" : "Search sent emails"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          aria-label="Filter"
          className="p-2 rounded-full text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10a34a]/30"
        >
          <FilterIcon />
        </button>
        <button
          type="button"
          aria-label="Refresh"
          onClick={handleRetry}
          className="p-2 rounded-full text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10a34a]/30"
        >
          <RefreshIcon />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={handleRetry} />
        ) : emails.length === 0 ? (
          activeTab === "scheduled" ? (
            <EmptyState
              title="No scheduled emails"
              description="You haven't scheduled any emails yet. Compose a new email to get started."
              actionLabel="Compose New Email"
              onAction={onCompose}
            />
          ) : (
            <EmptyState
              title="No sent emails"
              description="No emails have been sent yet. Scheduled emails will appear here once delivered."
            />
          )
        ) : (
          <EmailTable emails={emails} variant={activeTab} />
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && total > 0 ? (
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      ) : null}
    </div>
  );
}
