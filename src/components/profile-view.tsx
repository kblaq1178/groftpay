"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Coins,
  Network,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { CreateRequestForm } from "@/components/create-request-form";
import { PaymentHistory } from "@/components/payment-history";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { formatParty } from "@/lib/format";
import { formatNetworkId } from "@/lib/grofty/network";
import { findDemoProfile, type PaymentProfile } from "@/lib/profiles";
import { useClientValue } from "@/lib/use-client-value";
import { useProfileByUsername } from "@/lib/use-profiles";

const payerSteps = [
  {
    title: "Open the request",
    body: "The amount, purpose and recipient all travel inside the link or the QR code.",
  },
  {
    title: "Connect Grofty",
    body: "The wallet signs as the payer. GroftPay never sees a key.",
  },
  {
    title: "Approve the transfer",
    body: "The CC transfer is submitted to Canton and the ledger update id comes back.",
  },
];

export function ProfileView({ username }: { username: string }) {
  const hydrated = useClientValue(() => true, false);
  const localProfile = useProfileByUsername(username);
  const profile = localProfile ?? findDemoProfile(username);

  if (!profile) {
    if (!hydrated) return <ProfileSkeleton />;
    return <ProfileNotFound username={username} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14">
      <ProfileHeader profile={profile} />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-8">
        <CreateRequestForm
          preset={{
            partyId: profile.partyId,
            displayName: profile.displayName,
            username: profile.username,
            network: profile.network,
          }}
          title="Request payment"
          description={`Set the amount and what it is for. GroftPay builds a link and QR code you can send to whoever owes you - ${profile.displayName}'s Canton identity is already attached.`}
          submitLabel="Create payment request"
        />

        <aside className="flex flex-col gap-6">
          <div className="panel p-6 sm:p-7">
            <h2 className="text-[1.0625rem] font-semibold tracking-tight text-mist-100">
              How someone pays you
            </h2>
            <ol className="mt-5 flex flex-col gap-4">
              {payerSteps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04] text-[0.6875rem] text-mist-400">
                    {index + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.875rem] font-medium text-mist-200">{step.title}</span>
                    <p className="text-[0.8125rem] leading-relaxed text-mist-500">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 flex items-start gap-2 text-[0.75rem] leading-relaxed text-mist-600">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-400" />
              Settlement runs through Grofty on Canton TestNet. GroftPay holds no funds and needs no
              account.
            </p>
          </div>

          <PaymentHistory limit={3} heading="Recent requests on this device" hideWhenEmpty />
        </aside>
      </div>
    </div>
  );
}

function ProfileHeader({ profile }: { profile: PaymentProfile }) {
  return (
    <header className="panel relative overflow-hidden p-6 sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-mint-400/10 blur-3xl"
      />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <span className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-mint-300 to-violet-400 text-[1.5rem] font-semibold text-ink-950">
            {profile.initials}
          </span>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-mist-100 sm:text-[2rem]">
                {profile.displayName}
              </h1>
              {profile.isDemo ? (
                <Badge tone="amber">
                  <UserRound className="h-3.5 w-3.5" />
                  Demo profile
                </Badge>
              ) : (
                <Badge tone="violet">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Payment profile
                </Badge>
              )}
            </div>
            <p className="text-[0.9375rem] font-medium text-mint-300">@{profile.username}</p>
            {profile.headline ? (
              <p className="text-[0.9375rem] text-mist-300">{profile.headline}</p>
            ) : null}
            {profile.bio ? (
              <p className="max-w-2xl text-sm leading-relaxed text-mist-400">{profile.bio}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-0.5 text-[0.8125rem] text-mist-400">
              <span className="inline-flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-mint-400" />
                Paid in {profile.preferredAsset}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Network className="h-3.5 w-3.5 text-mist-500" />
                {formatNetworkId(profile.network)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/[0.03] px-4 py-3">
          <span className="inline-flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-mist-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            Canton identity
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-mono text-[0.75rem] text-mist-300">
              {formatParty(profile.partyId)}
            </span>
            <CopyButton
              value={profile.partyId}
              size="sm"
              variant="ghost"
              iconOnly
              label="Copy party id"
            />
          </span>
        </div>

        {profile.isDemo ? (
          <DemoNotice />
        ) : (
          <p className="text-[0.75rem] leading-relaxed text-mist-600">
            This profile is saved in the browser that created it. GroftPay has no server, so it is not
            shared between devices and the username is not registered globally.
          </p>
        )}
      </div>
    </header>
  );
}

function DemoNotice() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[0.8125rem] leading-relaxed text-amber-400">
        This is a sample payment profile for exploring GroftPay. Connect Grofty to create your own
        profile with your real Canton identity.
      </p>
      <Link
        href="/profile/create"
        className={buttonClasses({ variant: "secondary", size: "sm", className: "shrink-0" })}
      >
        Create your profile
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14">
      <div className="panel h-56 animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="panel h-96 animate-pulse" />
        <div className="panel h-72 animate-pulse" />
      </div>
    </div>
  );
}

function ProfileNotFound({ username }: { username: string }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-20 sm:px-8 sm:py-28">
      <div className="panel flex flex-col gap-6 p-7 sm:p-9">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/[0.04] text-mist-300">
          <UserRound className="h-5 w-5" />
        </span>

        <div className="flex flex-col gap-2.5">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-mist-100">
            No profile at this URL
          </h1>
          <p className="text-sm leading-relaxed text-mist-400">
            There is no GroftPay profile called{" "}
            <span className="font-mono text-mist-300">{username}</span> in this browser. Profiles are
            stored locally, so a profile created on another device will not appear here.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/profile/create" className={buttonClasses({ size: "lg" })}>
            Create a profile
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/profile" className={buttonClasses({ variant: "secondary", size: "lg" })}>
            Browse profiles
          </Link>
        </div>
      </div>
    </div>
  );
}