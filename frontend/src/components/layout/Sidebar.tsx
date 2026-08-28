import * as React from "react";
import type { DashboardTab } from "../../types";
import { Avatar } from "../ui/Avatar";

type UserInfo = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

type Props = {
  user: UserInfo;
  activeTab: DashboardTab;
  counts: { scheduled: number; sent: number };
  onTabChange: (tab: DashboardTab) => void;
  onCompose: () => void;
  onLogout: () => void;
};

function ClockIcon(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5V8L10.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <path d="M1.5 8L14 1.5L8.5 14L7 8.5L1.5 8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M7 8.5L14 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true" {...props}>
      <path d="M3 5.5L8 10L13 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Sidebar({ user, activeTab, counts, onTabChange, onCompose, onLogout }: Props): React.JSX.Element {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  return (
    <aside className="flex flex-col w-[220px] shrink-0 bg-white border-r border-[#e5e7eb] h-full overflow-y-auto">
      <div className="px-4 pt-5 pb-4">
        {/* Logo ONB — pixel/block style approximation */}
        <div className="mb-4 select-none" aria-label="ONB">
          <span
            className="font-black tracking-tighter leading-none text-[26px]"
            style={{ fontFamily: "'Space Grotesk', Inter, monospace", letterSpacing: "-0.04em" }}
          >
            <span className="inline-block border-[2.5px] border-black px-0.5 mr-0.5 leading-none">O</span>
            <span className="inline-block border-[2.5px] border-black px-0.5 mr-0.5 leading-none">N</span>
            <span className="inline-block border-[2.5px] border-black px-0.5 leading-none">B</span>
          </span>
        </div>

        {/* User card */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0]/60 rounded-xl px-2.5 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10a34a]/30"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
          >
            <Avatar name={user.name} src={user.avatarUrl} size={28} />
            <span className="flex-1 min-w-0">
              <span className="block text-[12.5px] font-semibold leading-none text-[#0f172a] truncate">{user.name}</span>
              <span className="block text-[11px] leading-none text-[#64748b] truncate mt-1">{user.email}</span>
            </span>
            <span className="text-[#94a3b8] shrink-0">
              <ChevronDownIcon />
            </span>
          </button>
          {userMenuOpen ? (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white border border-[#e5e7eb] rounded-xl shadow-lg p-1 z-10">
              <div className="px-3 py-2 border-b border-[#f1f5f9] mb-1">
                <p className="text-xs font-semibold text-[#0f172a] truncate">{user.name}</p>
                <p className="text-[11px] text-[#64748b] truncate">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-full text-left px-3 py-2 text-sm text-[#dc2626] hover:bg-[#fef2f2] rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]/20"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onCompose}
          className="mt-3 w-full h-8 rounded-full border border-[#10a34a] bg-white text-[#10a34a] text-[13px] font-medium hover:bg-[#ecfdf5] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10a34a]/30"
        >
          Compose
        </button>

        <div className="mt-6">
          <p className="px-2 text-[10px] font-semibold tracking-widest text-[#94a3b8] mb-2">CORE</p>
          <nav className="space-y-1" aria-label="Mailbox folders">
            <button
              type="button"
              onClick={() => onTabChange("scheduled")}
              aria-current={activeTab === "scheduled" ? "page" : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10a34a]/30 ${
                activeTab === "scheduled"
                  ? "bg-[#ecfdf5] text-[#0f172a] font-semibold"
                  : "text-[#475569] hover:bg-[#f8fafc] font-normal"
              }`}
            >
              <span className={activeTab === "scheduled" ? "text-[#0f172a]" : "text-[#64748b]"}>
                <ClockIcon />
              </span>
              <span className="flex-1 text-left text-[13px]">Scheduled</span>
              <span className={`text-xs tabular-nums ${activeTab === "scheduled" ? "text-[#64748b]" : "text-[#94a3b8]"}`}>
                {counts.scheduled}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange("sent")}
              aria-current={activeTab === "sent" ? "page" : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10a34a]/30 ${
                activeTab === "sent"
                  ? "bg-[#ecfdf5] text-[#0f172a] font-semibold"
                  : "text-[#475569] hover:bg-[#f8fafc] font-normal"
              }`}
            >
              <span className={activeTab === "sent" ? "text-[#0f172a]" : "text-[#64748b]"}>
                <SendIcon />
              </span>
              <span className="flex-1 text-left text-[13px]">Sent</span>
              <span className={`text-xs tabular-nums ${activeTab === "sent" ? "text-[#64748b]" : "text-[#94a3b8]"}`}>
                {counts.sent}
              </span>
            </button>
          </nav>
        </div>
      </div>
    </aside>
  );
}
