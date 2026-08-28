export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

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

export type DashboardTab = "scheduled" | "sent";
