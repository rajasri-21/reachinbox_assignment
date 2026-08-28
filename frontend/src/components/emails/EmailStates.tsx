import * as React from "react";
import { Button } from "../ui/Button";

export function LoadingState({ message = "Loading emails…" }: { message?: string }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center" aria-live="polite" aria-busy="true">
      <div className="w-6 h-6 rounded-full border-2 border-[#e2e8f0] border-t-[#10a34a] animate-spin mb-3" aria-hidden="true" />
      <p className="text-sm text-[#64748b]">{message}</p>
      <div className="mt-6 w-full max-w-md space-y-2" aria-hidden="true">
        <div className="h-10 rounded-lg bg-[#f1f5f9] animate-pulse" />
        <div className="h-10 rounded-lg bg-[#f1f5f9] animate-pulse" />
        <div className="h-10 rounded-lg bg-[#f1f5f9] animate-pulse" />
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center" role="alert">
      <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center text-[#dc2626] mb-3" aria-hidden="true">
        !
      </div>
      <p className="text-sm font-medium text-[#0f172a]">Something went wrong</p>
      <p className="text-sm text-[#64748b] mt-1 max-w-md">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8] mb-3" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="18" height="18" fill="none" aria-hidden="true">
          <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2.5 4L8 8.5L13.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[#0f172a]">{title}</p>
      {description ? <p className="text-sm text-[#64748b] mt-1 max-w-md">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
