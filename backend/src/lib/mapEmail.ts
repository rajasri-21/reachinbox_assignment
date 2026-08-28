import type { Email, Sender } from "@reachinbox/db";
import type { EmailListItem } from "@reachinbox/contracts";
import type { EmailSearchDocument } from "@reachinbox/search";

export function mapEmailRow(row: Email & { sender: Sender }): EmailListItem {
  return {
    id: row.id,
    recipient: row.recipient,
    senderEmail: row.sender.email,
    subject: row.subject,
    scheduledAt: row.scheduledAt.toISOString(),
    sentAt: row.sentAt ? row.sentAt.toISOString() : null,
    status: row.status,
    failureReason: row.failureReason,
    previewUrl: row.previewUrl,
  };
}

export function mapSearchDoc(doc: EmailSearchDocument): EmailListItem {
  return {
    id: doc.id,
    recipient: doc.recipient,
    senderEmail: doc.senderEmail,
    subject: doc.subject,
    scheduledAt: doc.scheduledAt,
    sentAt: doc.sentAt,
    status: doc.status,
    failureReason: doc.failureReason,
    previewUrl: doc.previewUrl,
  };
}
