import * as React from "react";
import { Badge } from "../ui/Badge";
import type { EmailStatus } from "../../services/api";

const labelMap: Record<EmailStatus, string> = {
  scheduled: "Scheduled",
  processing: "Processing",
  sent: "Sent",
  failed: "Failed",
};

const variantMap: Record<EmailStatus, "scheduled" | "sent" | "failed" | "default"> = {
  scheduled: "scheduled",
  processing: "default",
  sent: "sent",
  failed: "failed",
};

export function EmailStatusBadge({ status }: { status: EmailStatus }): React.JSX.Element {
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}
