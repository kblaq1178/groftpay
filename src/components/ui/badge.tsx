import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "mint" | "violet" | "amber" | "rose";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line bg-white/[0.04] text-mist-300",
  mint: "border-mint-400/30 bg-mint-400/10 text-mint-300",
  violet: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-400",
  rose: "border-rose-400/30 bg-rose-400/10 text-rose-400",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
