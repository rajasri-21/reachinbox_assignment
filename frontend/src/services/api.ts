/**
 * Typed API module — owns all backend calls.
 * Keeps credentials handling in one place.
 * Real integration (auth/me, google, emails, slack) will be added in Phase 4/5
 * without duplicating fetch logic inside components.
 */

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type ApiOptions = RequestInit & { auth?: boolean };

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export type AuthUser = { id: string; email: string; name: string; avatarUrl: string | null };

export const api = {
  getMe: () => request<{ user: AuthUser }>("/api/auth/me"),
  googleLogin: (credential: string) =>
    request<{ user: AuthUser }>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),
  logout: () =>
    request<{ ok: true }>("/api/auth/logout", {
      method: "POST",
    }),
  getSlackStatus: () =>
    request<{ connected: boolean; teamName: string | null; channelName: string | null }>(
      "/api/integrations/slack",
    ),
  disconnectSlack: () =>
    request<{ ok: true }>("/api/integrations/slack", { method: "DELETE" }),
  getSlackConnectUrl: () => `${API_URL}/api/integrations/slack/connect`,
};

export { API_URL };
