import * as React from "react";
import type { DashboardTab } from "../types";
import { Badge } from "../components/ui/Badge";

type EmailRowData = {
  id: string;
  to: string;
  subject: string;
  preview: string;
  timeLabel: string;
  status: "scheduled" | "sent";
};

const SCHEDULED_FIXTURE: EmailRowData[] = [
  {
    id: "1",
    to: "John Smith",
    subject: "Meeting follow-up - Scheduled",
    preview: "Hi John, just wanted to follow up on our meeting...",
    timeLabel: "Tue 9:15:12 AM",
    status: "scheduled",
  },
  {
    id: "2",
    to: "Olive",
    subject: "Ramit, great to meet you - you'll love it",
    preview: "Hi Olive, just wanted to follow up on our meeting...",
    timeLabel: "Thu 8:15:12 PM",
    status: "scheduled",
  },
];

const SENT_FIXTURE: EmailRowData[] = [
  {
    id: "3",
    to: "Sarah Wilson",
    subject: "Re: Project Update",
    preview: "Thanks for the update, Sarah. Looks good!",
    timeLabel: "Sent",
    status: "sent",
  },
  {
    id: "4",
    to: "Support",
    subject: "Issue with login",
    preview: "I am having trouble logging in to the dashboard...",
    timeLabel: "Sent",
    status: "sent",
  },
];

type Props = {
  activeTab: DashboardTab;
};

function SearchIcon(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M11 11L13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

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

function ClockSmallIcon(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4.8V8L10.2 9.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 1.2l1.6 3.3 3.6.5-2.6 2.5.6 3.6L8 9.3 4.8 11l.6-3.6L2.8 5 6.4 4.5 8 1.2Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmailRow({ row }: { row: EmailRowData }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors group">
      <span className="w-[120px] shrink-0 text-[13px] font-medium text-[#0f172a] truncate">
        To: {row.to}
      </span>
      <span className="flex-1 min-w-0 flex items-center gap-2">
        {row.status === "scheduled" ? (
          <Badge variant="scheduled" className="shrink-0 gap-1">
            <ClockSmallIcon className="text-[#c2410c]" />
            {row.timeLabel}
          </Badge>
        ) : (
          <Badge variant="sent" className="shrink-0">
            {row.timeLabel}
          </Badge>
        )}
        <span className="text-[13px] text-[#0f172a] font-medium truncate">{row.subject}</span>
        <span className="text-[13px] text-[#94a3b8] truncate hidden sm:inline"> - {row.preview}</span>
      </span>
      <button
        type="button"
        aria-label="Star"
        className="shrink-0 p-1.5 rounded-md text-[#cbd5e1] hover:text-[#64748b] hover:bg-[#f1f5f9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10a34a]/30"
      >
        <StarIcon />
      </button>
    </div>
  );
}

export function DashboardPage({ activeTab }: Props): React.JSX.Element {
  const [query, setQuery] = React.useState("");
  const rows = activeTab === "scheduled" ? SCHEDULED_FIXTURE : SENT_FIXTURE;
  const filtered = query.trim()
    ? rows.filter((r) => `${r.to} ${r.subject} ${r.preview}`.toLowerCase().includes(query.toLowerCase()))
    : rows;

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      {/* Search bar */}
      <div className="px-4 lg:px-6 py-3 flex items-center gap-3 border-b border-[#f1f5f9] lg:border-none">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-full bg-[#f1f5f9] border border-transparent text-sm placeholder:text-[#94a3b8] text-[#0f172a] focus:outline-none focus:bg-white focus:border-[#e2e8f0] focus:ring-2 focus:ring-[#10a34a]/15 transition-colors"
            aria-label="Search emails"
          />
        </div>
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
          className="p-2 rounded-full text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10a34a]/30"
        >
          <RefreshIcon />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8] mb-3">
              <SearchIcon />
            </div>
            <p className="text-sm font-medium text-[#0f172a]">No emails found</p>
            <p className="text-sm text-[#64748b] mt-1">Try adjusting your search or check another tab.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {filtered.map((row) => (
              <EmailRow key={row.id} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
