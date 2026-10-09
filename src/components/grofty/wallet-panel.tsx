"use client";

import {
  ArrowRight,
  CircleAlert,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { formatParty, partyHint, trimAmount } from "@/lib/format";
import { formatNetworkId } from "@/lib/grofty/network";
import type { GroftyWallet } from "@/lib/grofty/use-wallet";
import { GroftyInstallLink } from "./wallet-chip";

function PanelShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("panel p-6 sm:p-7", className)}>{children}</div>;
}

function PanelHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white/[0.04] text-mint-300">
        {icon}
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[1.0625rem] font-semibold tracking-tight text-mist-100">{title}</h3>
        {description ? (
          <p className="text-sm leading-relaxed text-mist-400">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function AccountRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-[0.8125rem] text-mist-400">{label}</span>
      <span className="flex min-w-0 items-center gap-2 text-right">{children}</span>
    </div>
  );
}

export function WalletPanel({ wallet }: { wallet: GroftyWallet }) {
  if (wallet.phase === "discovering") {
    return (
      <PanelShell>
        <div className="flex items-center gap-3 text-sm text-mist-400">
          <Spinner className="h-4 w-4 text-mint-400" />
          Looking for Grofty Wallet…
        </div>
        <div className="mt-5 space-y-3">
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/[0.05]" />
        </div>
      </PanelShell>
    );
  }

  if (wallet.phase === "unavailable") {
    return (
      <PanelShell>
        <PanelHeading
          icon={<TriangleAlert className="h-5 w-5 text-amber-400" />}
          title="Grofty Wallet not detected"
          description="GroftPay pays through Grofty, a CIP-0103 wallet for Canton. Install the extension, then come back to this link."
        />
        <ol className="mt-5 space-y-2.5 text-sm text-mist-400">
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04] text-[0.6875rem] font-medium text-mist-300">
              1
            </span>
            Install Grofty from <GroftyInstallLink className="ml-1" />
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04] text-[0.6875rem] font-medium text-mist-300">
              2
            </span>
            Reload this page, then connect.
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="https://grofty.cc"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-b from-mint-300 to-mint-500 px-5 text-sm font-medium text-ink-950 transition hover:from-mint-200 hover:to-mint-400"
          >
            Get Grofty
            <ArrowRight className="h-4 w-4" />
          </a>
          <Button variant="secondary" onClick={wallet.retryDiscovery}>
            <RefreshCw className="h-4 w-4" />
            Check again
          </Button>
        </div>
      </PanelShell>
    );
  }

  if (wallet.phase === "connected" && wallet.partyId) {
    return (
      <PanelShell>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-mint-400/25 bg-mint-400/10 text-mint-300">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[0.9375rem] font-medium tracking-tight text-mist-100">
                {partyHint(wallet.partyId)}
              </p>
              <p className="text-[0.8125rem] text-mist-400">Connected with Grofty</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-mint-400/25 bg-mint-400/10 px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mint-300">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
            Live
          </span>
        </div>

        <div className="mt-6 divide-y divide-[color:var(--color-line)]">
          <AccountRow label="Party">
            <span className="truncate font-mono text-[0.75rem] text-mist-200">
              {formatParty(wallet.partyId)}
            </span>
            <CopyButton value={wallet.partyId} size="sm" variant="ghost" iconOnly label="Copy party id" />
          </AccountRow>
          <AccountRow label="Network">
            <span className="text-[0.8125rem] text-mist-200">{formatNetworkId(wallet.networkId)}</span>
          </AccountRow>
          <AccountRow label="CC balance">
            {wallet.balance ? (
              <span className="tabular text-[0.8125rem] font-medium text-mist-100">
                {trimAmount(wallet.balance.amount)} CC
              </span>
            ) : wallet.isBalanceLoading ? (
              <span className="text-[0.8125rem] text-mist-500">Reading…</span>
            ) : (
              <span className="text-[0.8125rem] text-mist-500">Not reported</span>
            )}
          </AccountRow>
        </div>

        <p className="mt-6 flex items-start gap-2 text-[0.8125rem] leading-relaxed text-mist-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mist-400" />
          GroftPay never sees your keys. Every approval happens inside Grofty.
        </p>
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      <PanelHeading
        icon={<Wallet className="h-5 w-5" />}
        title="Connect Grofty to continue"
        description="Grofty signs for you on Canton. Connecting shares your party id and network with this page — nothing else."
      />

      {wallet.phase === "no-account" ? (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-[0.8125rem] leading-relaxed text-amber-400">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          This wallet has no Canton party yet. Finish onboarding inside Grofty, then reconnect.
        </p>
      ) : null}

      {wallet.errorMessage ? (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-4 py-3 text-[0.8125rem] leading-relaxed text-rose-400">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {wallet.errorMessage}
        </p>
      ) : null}

      <Button
        size="lg"
        className="mt-6 w-full"
        onClick={() => void wallet.connect()}
        disabled={wallet.isConnecting}
      >
        {wallet.isConnecting ? <Spinner className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
        {wallet.isConnecting ? "Waiting for Grofty…" : "Connect Grofty"}
      </Button>

      <ul className="mt-5 space-y-1.5 text-[0.75rem] text-mist-500">
        <li>CIP-0103 · Canton Testnet</li>
        <li>Non-custodial — the wallet holds the keys</li>
      </ul>
    </PanelShell>
  );
}
