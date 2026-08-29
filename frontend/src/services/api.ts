/**
 * Typed API module — owns all backend calls.
 * Keeps credentials handling in one place.
 */

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type ApiOptions = RequestInit & { auth?: boolean };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

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
    const body = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
    const message = body?.error ?? body?.message ?? `Request failed: ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

export type AuthUser = { id: string; email: string; name: string; avatarUrl: string | null };

// Mirrors frozen contracts in packages/contracts/src/index.ts — kept in sync, not redefined with divergent shape
export type EmailStatus = "scheduled" | "processing" | "sent" | "failed";
export type EmailListItem = {
  id: string;
  recipient: string;
  senderEmail: string;
  subject: string;
  scheduledAt: string;
  sentAt: string | null;
  status: EmailStatus;
  failureReason: string | null;
  previewUrl: string | null;
};
export type EmailListResponse = {
  emails: EmailListItem[];
  page: number;
  limit: number;
  total: number;
};
export type EmailListQuery = {
  status?: EmailStatus;
  q?: string;
  page?: number;
  limit?: number;
};

export type ScheduleEmailRequest = {
  senderEmail: string;
  subject: string;
  body: string;
  recipients: string[];
  startAt: string;
  delayMs: number;
  hourlyLimit: number;
};

export type ScheduleEmailResponse = {
  scheduledCount: number;
};

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

  getEmails: (query: EmailListQuery) => {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.q) params.set("q", query.q);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<EmailListResponse>(`/api/emails${qs ? `?${qs}` : ""}`);
  },

  scheduleEmails: (payload: ScheduleEmailRequest) =>
    request<ScheduleEmailResponse>("/api/emails/schedule", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export { API_URL };
