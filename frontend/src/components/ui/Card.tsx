import * as React from "react";
import { cn } from "../../utils/cn";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: Props): React.JSX.Element {
  return (
    <div
      className={cn("bg-white border border-[#e5e7eb] rounded-xl shadow-sm", className)}
      {...props}
    />
  );
}
