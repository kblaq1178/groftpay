"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheck, Coins, Info, ShieldCheck, UserRound } from "lucide-react";

import { WalletPanel } from "@/components/grofty/wallet-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { formatParty } from "@/lib/format";
import { formatNetworkId } from "@/lib/grofty/network";
import { useGroftyWallet } from "@/lib/grofty/use-wallet";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  createProfile,
  describeUsernameIssue,
  initialsFrom,
  type PaymentProfile,
} from "@/lib/profiles";
import { saveProfile } from "@/lib/profile-store";
import { useProfileForParty } from "@/lib/use-profiles";

interface FormErrors {
  username?: string;
  submit?: string;
}

export function ProfileSetup() {
  const router = useRouter();
  const wallet = useGroftyWallet({ withBalance: true });
  const existingProfile = useProfileForParty(wallet.partyId);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const connected = wallet.phase === "connected" && wallet.partyId !== null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!wallet.partyId) {
      setErrors({ submit: "Connect Grofty so GroftPay can attach your Canton identity." });
      return;
    }

    const usernameIssue = describeUsernameIssue(username);
    if (usernameIssue) {
      setErrors({ username: usernameIssue });
      return;
    }

    setErrors({});
    const profile = createProfile({
      username,
      displayName,
      headline,
      bio,
      partyId: wallet.partyId,
      network: wallet.networkId,
    });
    saveProfile(profile);
    router.push(`/profile/${profile.username}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 sm:py-16">
      <header className="flex flex-col gap-3">
        <Badge tone="mint" className="w-fit">
          <UserRound className="h-3.5 w-3.5" />
          Your payment profile
        </Badge>
        <h1 className="text-[2rem] font-semibold tracking-tight text-mist-100">
          Create your GroftPay profile
        </h1>
        <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-mist-400">
          Your Grofty wallet supplies the real Canton payment identity. GroftPay gives that identity a
          username and a page you can share, so clients never have to paste a party id.
        </p>
      </header>

      {existingProfile ? <ExistingProfileNote profile={existingProfile} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <WalletPanel wallet={wallet} />
          {connected && wallet.partyId ? <IdentityDetected wallet={wallet} /> : <HowItWillWork />}
        </div>

        <form onSubmit={handleSubmit} noValidate className="panel flex flex-col gap-6 p-6 sm:p-7">
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-mist-500">
              Step 2 - Choose a username
            </span>
            <h2 className="text-[1.375rem] font-semibold tracking-tight text-mist-100">
              Name your profile
            </h2>
            <p className="text-sm leading-relaxed text-mist-400">
              This is the handle people see when you ask to be paid. Display name and bio are optional.
            </p>
          </div>

          <Field
            label="Username"
            htmlFor="username"
            error={errors.username ?? null}
            hint={`Lowercase letters, numbers, hyphens and underscores. ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters. Stored in this browser - not registered globally.`}
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-mist-500">
                @
              </span>
              <Input
                id="username"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value.toLowerCase())}
                placeholder="kehinde"
                maxLength={USERNAME_MAX_LENGTH}
                autoComplete="off"
                spellCheck={false}
                invalid={Boolean(errors.username)}
                className="pl-8 font-mono text-[0.8125rem]"
              />
            </div>
          </Field>

          <Field label="Display name" htmlFor="displayName" optional>
            <Input
              id="displayName"
              name="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Kehinde"
              maxLength={60}
              autoComplete="nickname"
            />
          </Field>

          <Field label="Headline" htmlFor="headline" optional hint="A short role, e.g. Canton Builder.">
            <Input
              id="headline"
              name="headline"
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder="Canton Builder"
              maxLength={80}
            />
          </Field>

          <Field
            label="Bio"
            htmlFor="bio"
            optional
            hint="What you do, in a sentence. Shown on your profile."
          >
            <Textarea
              id="bio"
              name="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Available for design, development and Web3 work."
              maxLength={240}
              rows={3}
            />
          </Field>

          <ProfilePreview
            username={username}
            displayName={displayName}
            headline={headline}
            network={wallet.networkId}
          />

          {errors.submit ? (
            <p className="text-[0.8125rem] text-rose-400">{errors.submit}</p>
          ) : null}

          {!connected ? (
            <p className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-[0.8125rem] leading-relaxed text-amber-400">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Connect Grofty first. Your Canton Party ID comes from the wallet - GroftPay never invents
              one.
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={!connected} className="w-full">
            Create payment profile
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="flex items-start gap-2 text-[0.75rem] leading-relaxed text-mist-600">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-400" />
            There is no backend or authentication. This profile is saved in this browser against your
            connected Party ID, and the username is not registered anywhere.
          </p>
        </form>
      </div>
    </div>
  );
}

function ExistingProfileNote({ profile }: { profile: PaymentProfile }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white/[0.03] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[0.8125rem] leading-relaxed text-mist-400">
        This wallet already has the profile{" "}
        <span className="font-mono text-mist-200">@{profile.username}</span>. Saving a new username
        will replace it in this browser.
      </p>
      <Link
        href={`/profile/${profile.username}`}
        className="shrink-0 text-[0.8125rem] font-medium text-mint-300 transition hover:text-mint-200"
      >
        View it
      </Link>
    </div>
  );
}

function IdentityDetected({
  wallet,
}: {
  wallet: ReturnType<typeof useGroftyWallet>;
}) {
  return (
    <div className="panel flex flex-col gap-5 p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-mint-400/25 bg-mint-400/10 text-mint-300">
          <CircleCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[0.9375rem] font-medium tracking-tight text-mist-100">
            Canton identity detected
          </p>
          <p className="text-[0.8125rem] text-mist-400">This is what your wallet will be paid on.</p>
        </div>
      </div>

      <div className="divide-y divide-[color:var(--color-line)]">
        <div className="flex items-start justify-between gap-6 py-3.5">
          <span className="shrink-0 text-[0.8125rem] text-mist-500">Party ID</span>
          <span className="min-w-0 text-right font-mono text-[0.75rem] text-mist-200">
            {formatParty(wallet.partyId ?? "")}
          </span>
        </div>
        <div className="flex items-start justify-between gap-6 py-3.5">
          <span className="shrink-0 text-[0.8125rem] text-mist-500">Network</span>
          <span className="min-w-0 text-right text-[0.8125rem] text-mist-200">
            {formatNetworkId(wallet.networkId)}
          </span>
        </div>
        <div className="flex items-start justify-between gap-6 py-3.5">
          <span className="shrink-0 text-[0.8125rem] text-mist-500">CC balance</span>
          <span className="min-w-0 text-right text-[0.8125rem] text-mist-200">
            {wallet.balance
              ? `${wallet.balance.amount} CC`
              : wallet.isBalanceLoading
                ? "Reading..."
                : "Not reported"}
          </span>
        </div>
      </div>

      <p className="flex items-start gap-2 text-[0.75rem] leading-relaxed text-mist-600">
        <Coins className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-400" />
        CC is the only asset GroftPay requests today. TestNet settlement needs an eligible Grofty
        wallet.
      </p>
    </div>
  );
}

function HowItWillWork() {
  return (
    <div className="panel flex flex-col gap-4 p-6 sm:p-7">
      <h2 className="text-[1.0625rem] font-semibold tracking-tight text-mist-100">
        What happens when you connect
      </h2>
      <ol className="flex flex-col gap-3">
        {[
          "Grofty shares your Canton Party ID and network with this page.",
          "You choose a username to give that identity a human handle.",
          "GroftPay saves the profile in this browser against your Party ID.",
        ].map((item, index) => (
          <li key={item} className="flex gap-3 text-[0.8125rem] leading-relaxed text-mist-400">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04] text-[0.6875rem] text-mist-400">
              {index + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ProfilePreview({
  username,
  displayName,
  headline,
  network,
}: {
  username: string;
  displayName: string;
  headline: string;
  network: string | null;
}) {
  const handle = username.trim() || "username";
  const name = displayName.trim() || username.trim() || "Your name";
  return (
    <div className="rounded-2xl border border-line bg-white/[0.02] p-4">
      <span className="text-[0.625rem] font-medium uppercase tracking-[0.12em] text-mist-500">
        Preview
      </span>
      <div className="mt-3 flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-mint-300 to-violet-400 text-sm font-semibold text-ink-950">
          {initialsFrom(name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.9375rem] font-semibold tracking-tight text-mist-100">{name}</p>
          <p className="truncate text-[0.8125rem] text-mint-300">@{handle}</p>
        </div>
      </div>
      {headline.trim() ? (
        <p className="mt-3 text-[0.8125rem] text-mist-300">{headline.trim()}</p>
      ) : null}
      <p className="mt-3 text-[0.75rem] text-mist-500">
        {formatNetworkId(network)} - paid in CC
      </p>
    </div>
  );
}