import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const controlClasses =
  "w-full rounded-xl border border-line bg-ink-850/70 px-3.5 py-3 text-sm text-mist-100 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] transition placeholder:text-mist-500 hover:border-line-strong focus:border-mint-400/60 focus:bg-ink-800 focus:outline-none disabled:opacity-60 aria-[invalid=true]:border-rose-400/60";

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, optional, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[0.8125rem] font-medium tracking-tight text-mist-200"
        >
          {label}
        </label>
        {optional ? (
          <span className="text-[0.6875rem] uppercase tracking-[0.1em] text-mist-500">Optional</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="text-[0.8125rem] text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-[0.8125rem] leading-relaxed text-mist-500">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cn(controlClasses, "h-12 py-0", className)}
      aria-invalid={invalid ? true : undefined}
      {...props}
    />
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(controlClasses, "min-h-[5.5rem] resize-y leading-relaxed", className)}
      aria-invalid={invalid ? true : undefined}
      {...props}
    />
  );
}
