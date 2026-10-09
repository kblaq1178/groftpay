"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Coins, ShieldCheck, Wallet } from "lucide-react";

import { buttonClasses } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatParty, trimAmount } from "@/lib/format";
import { formatNetworkId } from "@/lib/grofty/network";
import { useGroftyWallet } from "@/lib/grofty/use-wallet";
import type { PaymentProfile } from "@/lib/profiles";
import { useProfileForParty } from "@/lib/use-profiles";

export function HomeHero() {
  const wallet = useGroftyWallet({ withBalance: true });
  const profile = useProfileForParty(wallet.partyId);
  const connected = wallet.phase === "connected" && wallet.partyId !== null;

  return (
    <section className="relative">
      <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 pb-14 pt-14 sm:px-8 sm:pb-16 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div className="flex flex-col gap-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-white/[0.04] px-3 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-mist-300">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
            Built on Canton - CIP-0103
          </span>

          <h1 className="text-[2.5rem] font-semibold leading-[1.04] tracking-tight text-mist-100 sm:text-[3.25rem] lg:text-[3.5rem]">
            Get paid on Canton.
            <br />
            <span className="text-gradient">Share one link.</span>
          </h1>

          <p className="max-w-xl text-[1.0625rem] leading-relaxed text-mist-400">
            Your Grofty wallet is your Canton payment identity. GroftPay reads it, gives it a username,
            and builds a request link a client can settle in CC - no accounts, no custody.
          </p>

          <HeroActions connected={connected} hasProfile={profile !== null} wallet={wallet} />
        </div>

        <div className="relative">
          <div className="halo -top-10 -right-8 h-56 w-56 bg-mint-400/20" aria-hidden="true" />
          <div className="halo -bottom-8 -left-12 h-52 w-52 bg-violet-400/20" aria-hidden="true" />

          {connected ? (
            <ReceivingCard wallet={wallet} profile={profile} />
          ) : (
            <IdentityExplainer />
          )}
        </div>
      </div>
    </section>
  );
}

function HeroActions({
  connected,
  hasProfile,
  wallet,
}: {
  connected: boolean;
  hasProfile: boolean;
  wallet: ReturnType<typeof useGroftyWallet>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {connected ? (
        <>
          <Link href="#create" className={buttonClasses({ size: "lg" })}>
            Create payment request
            <ArrowRight className="h-4 w-4" />
          </Link>
          {hasProfile ? (
            <Link href="/profile" className={buttonClasses({ variant: "secondary", size: "lg" })}>
              View my profile
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/profile/create"
              className={buttonClasses({ variant: "secondary", size: "lg" })}
            >
              Create payment profile
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </>
      ) : (
        <>
          {wallet.phase === "unavailable" ? (
            <a
              href="https://grofty.cc"
              target="_blank"
              rel="noreferrer noopener"
              className={buttonClasses({ size: "lg" })}
            >
              Get Grofty
              <ArrowUpRight className="h-4 w-4" />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => void wallet.connect()}
              disabled={wallet.isConnecting || wallet.phase === "discovering"}
              className={buttonClasses({ size: "lg" })}
            >
              {wallet.isConnecting || wallet.phase === "discovering" ? (
                <Spinner className="h-4 w-4" />
              ) : null}
              {wallet.isConnecting
                ? "Connecting"
                : wallet.phase === "discovering"
                  ? "Detecting Grofty"
                  : "Connect Grofty"}
            </button>
          )}
          <Link href="#create" className={buttonClasses({ variant: "secondary", size: "lg" })}>
            Create payment request
            <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      )}
    </div>
  );
}

function IdentityExplainer() {
  return (
    <div className="panel flex flex-col gap-5 p-6 sm:p-7">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/[0.04] text-mint-300">
        <Wallet className="h-5 w-5" />
      </span>
      <div className="flex flex-col gap-2">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-mist-500">
          Canton payment identity
        </span>
        <h2 className="text-[1.25rem] font-semibold tracking-tight text-mist-100">
          Your wallet is your identity
        </h2>
        <p className="text-[0.875rem] leading-relaxed text-mist-400">
          Connect Grofty and GroftPay reads your Canton Party ID, network and CC balance.
        </p>
      </div>
      <ul className="flex flex-col gap-2.5 border-t border-line pt-5 text-[0.8125rem] text-mist-400">
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-mint-400" />
          Non-custodial - the wallet holds the keys
        </li>
        <li className="flex items-center gap-2">
          <Coins className="h-4 w-4 shrink-0 text-mint-400" />
          Settles in CC on Canton
        </li>
        <li className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 shrink-0 text-mint-400" />
          Then choose a username for your profile
        </li>
      </ul>
    </div>
  );
}

function ReceivingCard({
  wallet,
  profile,
}: {
  wallet: ReturnType<typeof useGroftyWallet>;
  profile: PaymentProfile | null;
}) {
  const partyId = wallet.partyId ?? "";
  return (
    <div className="panel flex flex-col gap-5 p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-mist-500">
          Receiving as
        </span>
        <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-mint-300">
          <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
          Connected
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-mint-300 to-violet-400 text-sm font-semibold text-ink-950">
          {profile?.initials ?? "GW"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[1.0625rem] font-semibold tracking-tight text-mist-100">
            {profile?.displayName ?? "Your Grofty wallet"}
          </p>
          <p className="truncate text-[0.875rem] text-mint-300">
            {profile ? `@${profile.username}` : formatParty(partyId)}
          </p>
        </div>
      </div>

      <div className="divide-y divide-[color:var(--color-line)] border-t border-line text-[0.8125rem]">
        <div className="flex items-start justify-between gap-4 py-3">
          <span className="text-mist-500">Party ID</span>
          <span className="min-w-0 text-right font-mono text-[0.75rem] text-mist-200">
            {formatParty(partyId)}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4 py-3">
          <span className="text-mist-500">Network</span>
          <span className="text-right text-mist-200">{formatNetworkId(wallet.networkId)}</span>
        </div>
        <div className="flex items-start justify-between gap-4 py-3">
          <span className="text-mist-500">CC balance</span>
          <span className="tabular text-right text-mist-200">
            {wallet.balance
              ? `${trimAmount(wallet.balance.amount)} CC`
              : wallet.isBalanceLoading
                ? "Reading..."
                : "Not reported"}
          </span>
        </div>
      </div>
    </div>
  );
}