import * as React from "react";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AppLayout } from "./components/layout/AppLayout";
import { ComposeEmail } from "./components/compose/ComposeEmail";
import type { DashboardTab } from "./types";

type User = { name: string; email: string; avatarUrl: string | null };

const DEMO_USER: User = {
  name: "Oliver Brown",
  email: "oliver.brown@domain.io",
  avatarUrl: null,
};

export default function App(): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<DashboardTab>("scheduled");
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [toast, setToast] = React.useState<string | null>(null);

  // Demo counts matching Figma 02 vs 04 — scheduled 12, sent 785
  const counts = { scheduled: 12, sent: 785 };

  const handleGoogleLogin = React.useCallback(() => {
    // Phase 1: foundation only — simulate auth transition.
    // Real Google Identity Services + POST /api/auth/google will be wired in Phase 4.
    setIsAuthenticated(true);
  }, []);

  const handleLogout = React.useCallback(() => {
    setIsAuthenticated(false);
    setActiveTab("scheduled");
  }, []);

  const handleCompose = React.useCallback(() => {
    setComposeOpen(true);
  }, []);

  const handleComposeSuccess = React.useCallback(
    (count: number) => {
      setToast(`Successfully scheduled ${count} emails.`);
      setRefreshKey((k) => k + 1);
      // Switch to scheduled tab to show new items
      setActiveTab("scheduled");
      window.setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  if (!isAuthenticated) {
    return <LoginPage onGoogleLogin={handleGoogleLogin} />;
  }

  return (
    <>
      <AppLayout
        user={DEMO_USER}
        activeTab={activeTab}
        counts={counts}
        onTabChange={setActiveTab}
        onCompose={handleCompose}
        onLogout={handleLogout}
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
