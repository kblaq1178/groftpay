"use client";

import Link from "next/link";
import { ArrowRight, Coins, Plus, UserRound, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { formatParty } from "@/lib/format";
import { listDemoProfiles, type PaymentProfile } from "@/lib/profiles";
import { useGroftyWallet } from "@/lib/grofty/use-wallet";
import { useProfileForParty, useProfiles } from "@/lib/use-profiles";

export function ProfileDirectory() {
  const wallet = useGroftyWallet();
  const localProfiles = useProfiles();
  const ownProfile = useProfileForParty(wallet.partyId);

  const profiles: PaymentProfile[] = [
    ...localProfiles,
    ...listDemoProfiles().filter(
      (demo) => !localProfiles.some((profile) => profile.username === demo.username),
    ),
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-12 sm:px-8 sm:py-16">
      <header className="flex flex-col gap-3">
        <Badge tone="violet" className="w-fit">
          <Users className="h-3.5 w-3.5" />
          Profiles
        </Badge>
        <h1 className="text-[2rem] font-semibold tracking-tight text-mist-100">
          Canton payment profiles
        </h1>
        <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-mist-400">
          A profile gives a Canton Party ID a human handle like{" "}
          <span className="font-mono text-mist-300">@kehinde</span> and a page to be paid from. Your
          connected Grofty wallet supplies the real Canton identity; GroftPay adds the name.
        </p>
      </header>

      <OurProfileBanner ownProfile={ownProfile} />

      {profiles.length === 0 ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-10 text-center">
          <UserRound className="h-5 w-5 text-mist-600" />
          <p className="text-sm text-mist-400">No profiles in this browser yet.</p>
          <Link href="/profile/create" className={buttonClasses({ size: "lg" })}>
            Create your payment profile
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {profiles.map((profile) => (
            <ProfileCard key={profile.username} profile={profile} />
          ))}
        </div>
      )}

      <p className="text-[0.75rem] leading-relaxed text-mist-600">
        Profiles are stored in this browser only. Usernames are not registered globally, there is no
        account or backend, and a profile created on another device will not appear here. CC is the
        asset every request uses today.
      </p>
    </div>
  );
}

function OurProfileBanner({ ownProfile }: { ownProfile: PaymentProfile | null }) {
  if (ownProfile) {
    return (
      <div className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-mint-300 to-violet-400 text-[0.8125rem] font-semibold text-ink-950">
            {ownProfile.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.9375rem] font-medium text-mist-100">
              {ownProfile.displayName}
            </p>
            <p className="truncate text-[0.8125rem] text-mint-300">@{ownProfile.username}</p>
          </div>
        </div>
        <Link
          href={`/profile/${ownProfile.username}`}
          className={buttonClasses({ variant: "secondary", size: "sm", className: "shrink-0" })}
        >
          View my profile
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-[0.9375rem] font-medium text-mist-100">Create your payment profile</p>
        <p className="text-[0.8125rem] leading-relaxed text-mist-400">
          Connect Grofty to detect your Canton identity, then choose a username.
        </p>
      </div>
      <Link
        href="/profile/create"
        className={buttonClasses({ size: "sm", className: "shrink-0" })}
      >
        <Plus className="h-3.5 w-3.5" />
        Create profile
      </Link>
    </div>
  );
}

function ProfileCard({ profile }: { profile: PaymentProfile }) {
  return (
    <Link
      href={`/profile/${profile.username}`}
      className="panel group flex flex-col gap-4 p-6 transition hover:border-line-strong hover:bg-ink-850"
    >
      <div className="flex items-center gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-mint-300 to-violet-400 text-base font-semibold text-ink-950">
          {profile.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[1.0625rem] font-semibold tracking-tight text-mist-100">
            {profile.displayName}
          </p>
          <p className="truncate text-[0.8125rem] text-mint-300">@{profile.username}</p>
        </div>
        {profile.isDemo ? (
          <Badge tone="amber" className="ml-auto shrink-0">
            Demo
          </Badge>
        ) : (
          <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-mist-500 transition group-hover:text-mint-300" />
        )}
      </div>

      {profile.headline ? (
        <p className="text-[0.8125rem] font-medium text-mist-300">{profile.headline}</p>
      ) : null}

      {profile.bio ? (
        <p className="line-clamp-2 text-[0.8125rem] leading-relaxed text-mist-400">{profile.bio}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-[0.75rem] text-mist-500">
        <span className="inline-flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5 text-mint-400" />
          {profile.preferredAsset}
        </span>
        <span className="truncate font-mono">{formatParty(profile.partyId)}</span>
      </div>
    </Link>
  );
}