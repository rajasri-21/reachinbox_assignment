import * as React from "react";

type Props = {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
};

export function Avatar({ name, src, size = 32, className }: Props): React.JSX.Element {
  const fallback = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className ?? ""}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-label={name}
      className={`inline-flex items-center justify-center rounded-full bg-[#e2e8f0] text-[#475569] text-xs font-semibold shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {fallback}
    </span>
  );
}
