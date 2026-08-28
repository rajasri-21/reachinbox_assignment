export const EMAIL_QUEUE = "email-send";

export const EMAIL_STATUSES = ["scheduled", "processing", "sent", "failed"] as const;

export type EmailStatus = (typeof EMAIL_STATUSES)[number];

export type SendEmailJob = {
  emailId: string;
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

export type EmailListQuery = {
  status?: EmailStatus;
  q?: string;
  page?: number;
  limit?: number;
};

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
