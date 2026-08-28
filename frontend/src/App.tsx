import * as React from "react";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AppLayout } from "./components/layout/AppLayout";
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
    // Phase 1 placeholder — compose modal/page lands in Phase 3
    window.alert("Compose flow will be available in Phase 3.");
  }, []);

  if (!isAuthenticated) {
    return <LoginPage onGoogleLogin={handleGoogleLogin} />;
  }

  return (
    <AppLayout
      user={DEMO_USER}
      activeTab={activeTab}
      counts={counts}
      onTabChange={setActiveTab}
      onCompose={handleCompose}
      onLogout={handleLogout}
    >
      <DashboardPage activeTab={activeTab} onCompose={handleCompose} />
    </AppLayout>
  );
}
