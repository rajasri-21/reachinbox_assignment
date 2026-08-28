import * as React from "react";
import { cn } from "../../utils/cn";

type BadgeVariant = "scheduled" | "sent" | "failed" | "default";

const variantMap: Record<BadgeVariant, string> = {
  scheduled: "bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]",
  sent: "bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]",
  failed: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
  default: "bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]",
};

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ variant = "default", className, children, ...props }: Props): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none",
        variantMap[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
