import * as React from "react";
import { Sidebar } from "./Sidebar";
import type { DashboardTab } from "../../types";

type UserInfo = { name: string; email: string; avatarUrl: string | null };

type Props = {
  user: UserInfo;
  activeTab: DashboardTab;
  counts: { scheduled: number; sent: number };
  onTabChange: (tab: DashboardTab) => void;
  onCompose: () => void;
  onLogout: () => void;
  children: React.ReactNode;
};

export function AppLayout({ user, activeTab, counts, onTabChange, onCompose, onLogout, children }: Props): React.JSX.Element {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#e5e7eb] sticky top-0 z-20">
        <span className="font-black tracking-tighter text-[20px]" style={{ fontFamily: "'Space Grotesk', monospace" }}>
          ONB
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 rounded-lg border border-[#e5e7eb] text-[#475569] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10a34a]/30"
          aria-label="Toggle navigation"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 5h12M2 8h12M2 11h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <Sidebar user={user} activeTab={activeTab} counts={counts} onTabChange={onTabChange} onCompose={onCompose} onLogout={onLogout} />
        </div>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="lg:hidden fixed inset-0 z-30 flex">
            <button type="button" aria-label="Close menu" className="flex-1 bg-black/30" onClick={() => setMobileOpen(false)} />
            <div className="w-[260px] bg-white shadow-xl overflow-y-auto">
              <Sidebar
                user={user}
                activeTab={activeTab}
                counts={counts}
                onTabChange={(t) => {
                  onTabChange(t);
                  setMobileOpen(false);
                }}
                onCompose={() => {
                  onCompose();
                  setMobileOpen(false);
                }}
                onLogout={onLogout}
              />
            </div>
          </div>
        ) : null}

        <main className="flex-1 min-w-0 bg-white lg:bg-[#f8fafc] flex flex-col">
          <div className="flex-1 flex flex-col max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
