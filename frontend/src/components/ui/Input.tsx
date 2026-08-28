import * as React from "react";
import { cn } from "../../utils/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props): React.JSX.Element {
  return (
    <input
      className={cn(
        "w-full h-11 px-4 rounded-lg bg-[#f4f6f5] border border-transparent",
        "text-sm text-[#0f172a] placeholder:text-[#94a3b8]",
        "focus:outline-none focus:bg-white focus:border-[#cbd5e1] focus:ring-2 focus:ring-[#10a34a]/20",
        "transition-colors",
        className,
      )}
      {...props}
    />
  );
}
