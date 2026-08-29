import * as React from "react";
import { api, ApiError, setUnauthorizedHandler, type AuthUser } from "../services/api";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

const BYPASS_AUTH = true; // flag: bypass login -> force dashboard; set to import.meta.env.VITE_BYPASS_AUTH === "true" to make env-controlled

const MOCK_BYPASS_USER: AuthUser = {
  id: "dev-bypass",
  email: "dev@reachinbox.local",
  name: "Dev User (Bypass)",
  avatarUrl: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [user, setUser] = React.useState<AuthUser | null>(BYPASS_AUTH ? MOCK_BYPASS_USER : null);
  const [loading, setLoading] = React.useState(BYPASS_AUTH ? false : true);
  const [error, setError] = React.useState<string | null>(null);

  // Avoid repeated unauthorized notifications causing render loops
  const clearUserRef = React.useRef<() => void>(() => {});
  clearUserRef.current = React.useCallback(() => {
    setUser((prev) => (prev === null ? prev : null));
  }, []);

  React.useEffect(() => {
    if (BYPASS_AUTH) return;
    setUnauthorizedHandler(() => {
      clearUserRef.current();
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const refresh = React.useCallback(async () => {
    if (BYPASS_AUTH) {
      setUser(MOCK_BYPASS_USER);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUser(null);
      } else {
        setUser(null);
        setError(e instanceof Error ? e.message : "Failed to fetch user");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = React.useCallback(async (credential: string) => {
    if (BYPASS_AUTH) {
      setUser(MOCK_BYPASS_USER);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.googleLogin(credential);
      setUser(res.user);
    } catch (e) {
      setUser(null);
      const message = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Login failed";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = React.useCallback(async () => {
    if (BYPASS_AUTH) {
      setUser(MOCK_BYPASS_USER);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await api.logout();
    } catch {
      // Even if logout fails (e.g. network), clear local state
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, []);

  const clearError = React.useCallback(() => setError(null), []);

  React.useEffect(() => {
    if (BYPASS_AUTH) return;
    void refresh();
  }, [refresh]);

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, loading, error, login, logout, refresh, clearError }),
    [user, loading, error, login, logout, refresh, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
