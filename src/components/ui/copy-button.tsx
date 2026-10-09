"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

function legacyCopy(value: string): boolean {
  try {
    const node = document.createElement("textarea");
    node.value = value;
    node.setAttribute("readonly", "");
    node.style.position = "fixed";
    node.style.opacity = "0";
    document.body.appendChild(node);
    node.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(node);
    return ok;
  } catch {
    return false;
  }
}

export interface CopyButtonProps {
  value: string;
  label?: string;
  copiedLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  iconOnly?: boolean;
}

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  variant = "secondary",
  size = "md",
  className,
  iconOnly = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) ok = legacyCopy(value);
    if (!ok) return;

    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? copiedLabel : label}
      className={buttonClasses({ variant, size, className: cn(iconOnly && "w-11 px-0", className) })}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {iconOnly ? null : <span>{copied ? copiedLabel : label}</span>}
    </button>
  );
}
