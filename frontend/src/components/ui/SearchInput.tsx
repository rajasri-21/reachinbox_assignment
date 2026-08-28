import * as React from "react";
import { cn } from "../../utils/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  onDebouncedChange?: (value: string) => void;
  debounceMs?: number;
};

function SearchIcon(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" {...props}>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M11 11L13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function SearchInput({ className, onDebouncedChange: _odc, debounceMs: _d, ...props }: Props): React.JSX.Element {
  return (
    <div className={cn("relative flex-1", className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
        <SearchIcon />
      </span>
      <input
        type="search"
        className="w-full h-8 pl-8 pr-3 rounded-full bg-[#f1f5f9] border border-transparent text-sm placeholder:text-[#94a3b8] text-[#0f172a] focus:outline-none focus:bg-white focus:border-[#e2e8f0] focus:ring-2 focus:ring-[#10a34a]/15 transition-colors"
        aria-label="Search emails"
        {...props}
      />
    </div>
  );
}
