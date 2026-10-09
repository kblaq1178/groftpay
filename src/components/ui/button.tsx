import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-mint-300 to-mint-500 text-ink-950 shadow-[0_12px_34px_-14px_rgba(52,220,160,0.9)] hover:from-mint-200 hover:to-mint-400 hover:shadow-[0_16px_44px_-14px_rgba(52,220,160,1)] active:translate-y-px",
  secondary:
    "border border-line bg-white/[0.06] text-mist-100 hover:border-line-strong hover:bg-white/[0.1] active:translate-y-px",
  outline:
    "border border-line-strong bg-transparent text-mist-100 hover:bg-white/[0.05] active:translate-y-px",
  ghost: "text-mist-300 hover:bg-white/[0.06] hover:text-mist-100",
  danger:
    "border border-rose-400/30 bg-rose-400/10 text-rose-400 hover:bg-rose-400/16",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[0.9375rem]",
  xl: "h-14 px-8 text-base",
};

export function buttonClasses(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  const { variant = "primary", size = "md", className } = options ?? {};
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}
