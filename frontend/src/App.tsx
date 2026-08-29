import * as React from "react";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AppLayout } from "./components/layout/AppLayout";
import { ComposeEmail } from "./components/compose/ComposeEmail";
import { useAuth } from "./context/AuthContext";
import { api } from "./services/api";
import type { DashboardTab } from "./types";

export default function App(): React.JSX.Element {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState<DashboardTab>("scheduled");
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [toast, setToast] = React.useState<string | null>(null);
  const [counts, setCounts] = React.useState<{ scheduled: number; sent: number }>({ scheduled: 0, sent: 0 });

  const handleLogout = React.useCallback(async () => {
    await logout();
    setActiveTab("scheduled");
    setComposeOpen(false);
  }, [logout]);

  const handleCompose = React.useCallback(() => {
    setComposeOpen(true);
  }, []);

  const handleComposeSuccess = React.useCallback(
    (count: number) => {
      setToast(`Successfully scheduled ${count} emails.`);
      setRefreshKey((k) => k + 1);
      setActiveTab("scheduled");
      window.setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  // Fetch real counts for sidebar when authenticated; keep Figma layout but with live data
  React.useEffect(() => {
    if (!user) {
      setCounts({ scheduled: 0, sent: 0 });
      return;
    }
    let cancelled = false;
    async function fetchCounts(): Promise<void> {
      try {
        const [scheduledRes, sentRes] = await Promise.all([
          api.getEmails({ status: "scheduled", page: 1, limit: 1 }),
          api.getEmails({ status: "sent", page: 1, limit: 1 }),
        ]);
        if (!cancelled) {
          setCounts({ scheduled: scheduledRes.total, sent: sentRes.total });
        }
      } catch {
        // Counts are non-critical; keep previous values on error
      }
    }
    void fetchCounts();
    return () => {
      cancelled = true;
    };
  }, [user, refreshKey, activeTab]);

  // Refresh counts when DashboardPage refreshes via refreshKey/activeTab changes already covered

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8" aria-live="polite" aria-busy="true">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#e2e8f0] border-t-[#10a34a] animate-spin" aria-hidden="true" />
          <p className="text-sm text-[#64748b]">Loading session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <>
      <AppLayout
        user={user}
        activeTab={activeTab}
        counts={counts}
        onTabChange={setActiveTab}
        onCompose={handleCompose}
        onLogout={() => void handleLogout()}
      >
        <DashboardPage activeTab={activeTab} onCompose={handleCompose} refreshKey={refreshKey} />
      </AppLayout>

      <ComposeEmail open={composeOpen} onClose={() => setComposeOpen(false)} onSuccess={handleComposeSuccess} />

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-[#0f172a] text-white text-sm px-4 py-3 rounded-xl shadow-lg border border-[#1e293b] max-w-[90vw]"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
