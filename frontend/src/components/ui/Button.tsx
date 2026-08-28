import * as React from "react";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#10a34a] text-white hover:bg-[#0e8a3e] focus-visible:ring-[#10a34a] border border-[#10a34a] shadow-sm",
  secondary:
    "bg-[#f1f8f3] text-[#0f172a] hover:bg-[#e6f2e9] focus-visible:ring-[#10a34a] border border-transparent",
  ghost:
    "bg-transparent text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] border border-transparent",
  outline:
    "bg-white text-[#10a34a] border border-[#10a34a] hover:bg-[#ecfdf5] focus-visible:ring-[#10a34a]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-full",
  md: "h-9 px-4 text-sm rounded-full",
  lg: "h-11 px-6 text-sm rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: Props): React.JSX.Element {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
