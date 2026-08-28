import * as React from "react";
import type { EmailListItem } from "../../services/api";
import { EmailStatusBadge } from "./EmailStatusBadge";

type Props = {
  emails: EmailListItem[];
  variant: "scheduled" | "sent";
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso ?? "—";
  }
}

export function EmailTable({ emails, variant }: Props): React.JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left border-collapse">
        <thead>
          <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]/60">
            <th className="px-4 py-2.5 text-[11px] font-semibold tracking-widest text-[#64748b] uppercase">Email / Recipient</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold tracking-widest text-[#64748b] uppercase">Subject</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold tracking-widest text-[#64748b] uppercase whitespace-nowrap">
              {variant === "scheduled" ? "Scheduled time" : "Sent time"}
            </th>
            <th className="px-4 py-2.5 text-[11px] font-semibold tracking-widest text-[#64748b] uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9]">
          {emails.map((email) => (
            <tr key={email.id} className="hover:bg-[#f8fafc] transition-colors">
              <td className="px-4 py-3.5">
                <div className="text-[13px] font-medium text-[#0f172a] truncate max-w-[220px]" title={email.recipient}>
                  {email.recipient}
                </div>
                <div className="text-[11px] text-[#94a3b8] truncate max-w-[220px]" title={email.senderEmail}>
                  from {email.senderEmail}
                </div>
              </td>
              <td className="px-4 py-3.5">
                <div className="text-[13px] text-[#0f172a] truncate max-w-[280px]" title={email.subject}>
                  {email.subject}
                </div>
              </td>
              <td className="px-4 py-3.5 text-[13px] text-[#475569] whitespace-nowrap">
                {variant === "scheduled" ? formatTime(email.scheduledAt) : formatTime(email.sentAt ?? email.scheduledAt)}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex flex-col gap-1.5 items-start">
                  <EmailStatusBadge status={email.status} />
                  {email.status === "failed" && email.failureReason ? (
                    <span className="text-[11px] text-[#dc2626] max-w-[200px] truncate" title={email.failureReason}>
                      {email.failureReason}
                    </span>
                  ) : null}
                  {email.status === "sent" && email.previewUrl ? (
                    <a
                      href={email.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#0ea5e9] hover:text-[#0284c7] underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/30 rounded"
                    >
                      View preview
                    </a>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
