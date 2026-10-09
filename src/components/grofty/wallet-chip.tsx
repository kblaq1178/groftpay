"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, LogOut, ShieldCheck } from "lucide-react";

import { CopyButton } from "@/components/ui/copy-button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { formatParty, partyHint, trimAmount } from "@/lib/format";
import { formatNetworkId } from "@/lib/grofty/network";
import type { GroftyWallet } from "@/lib/grofty/use-wallet";

export function WalletChip({ wallet }: { wallet: GroftyWallet }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const partyId = wallet.partyId;
  const label = partyId ? partyHint(partyId) : "Grofty";

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border border-line bg-white/[0.05] pl-3 pr-2.5 text-[0.8125rem] font-medium text-mist-100 transition hover:border-line-strong hover:bg-white/[0.09]",
          open && "border-mint-400/40 bg-white/[0.09]",
        )}
      >
        <span className="relative flex h-2 w-2 items-center justify-center">
          <span className="absolute inline-flex h-2 w-2 rounded-full bg-mint-400" />
          <span className="absolute inline-flex h-2 w-2 animate-pulse-ring rounded-full bg-mint-400" />
        </span>
        <span className="max-w-[9.5rem] truncate">{label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-mist-500 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[19.5rem] origin-top-right animate-rise overflow-hidden rounded-2xl border border-line bg-ink-900/95 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-mist-400">
              <ShieldCheck className="h-3.5 w-3.5 text-mint-400" />
              Grofty connected
            </div>
            <span className="rounded-full border border-line bg-white/[0.04] px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.08em] text-mist-400">
              {formatNetworkId(wallet.networkId)}
            </span>
          </div>

          <div className="flex flex-col gap-3 px-4 py-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[0.6875rem] uppercase tracking-[0.1em] text-mist-500">Party</span>
              <span className="break-all font-mono text-[0.75rem] leading-relaxed text-mist-200">
                {partyId ?? "No party available"}
              </span>
            </div>

            {wallet.balance ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-mist-400">CC balance</span>
                <span className="tabular font-medium text-mist-100">
                  {trimAmount(wallet.balance.amount)} CC
                </span>
              </div>
            ) : null}

            {wallet.signingProviderId ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-mist-400">Signing</span>
                <span className="font-mono text-[0.75rem] text-mist-300">
                  {wallet.signingProviderId}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 border-t border-line px-4 py-3">
            {partyId ? <CopyButton value={partyId} label="Copy party" size="sm" variant="ghost" /> : null}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void wallet.disconnect();
              }}
              disabled={wallet.isDisconnecting}
              className="ml-auto inline-flex h-9 items-center gap-2 rounded-full px-3 text-[0.8125rem] font-medium text-mist-400 transition hover:bg-white/[0.06] hover:text-mist-100 disabled:opacity-50"
            >
              {wallet.isDisconnecting ? <Spinner className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
              Disconnect
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function WalletPartyLine({ partyId }: { partyId: string | null }) {
  if (!partyId) return null;
  return (
    <span className="font-mono text-[0.75rem] text-mist-300">{formatParty(partyId)}</span>
  );
}

export function GroftyInstallLink({ className }: { className?: string }) {
  return (
    <a
      href="https://grofty.cc"
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "inline-flex items-center gap-1.5 text-mint-300 underline-offset-4 transition hover:text-mint-200 hover:underline",
        className,
      )}
    >
      grofty.cc
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
