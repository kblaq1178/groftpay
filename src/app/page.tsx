import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CircleCheck,
  Link2,
  Minus,
  PenLine,
  UserRound,
  Wallet,
  Zap,
} from "lucide-react";

import { CreateRequestForm } from "@/components/create-request-form";
import { HomeHero } from "@/components/home-hero";
import { PaymentHistory } from "@/components/payment-history";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { DEMO_PROFILE } from "@/lib/profiles";

export const metadata: Metadata = {
  title: "GroftPay - get paid on Canton",
  description:
    "GroftPay gives your Grofty wallet a username and a payment profile, then lets you share a link a client settles in CC on Canton.",
};

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    icon: PenLine,
    title: "Create the request",
    body: "Set the amount in CC and what the work was. Your connected identity is the recipient.",
  },
  {
    icon: Link2,
    title: "Share the link",
    body: "The whole request travels inside the URL. Nothing to look up, no account to create.",
  },
  {
    icon: Wallet,
    title: "Connect Grofty",
    body: "The payer connects their CIP-0103 wallet and reviews the request before approving.",
  },
  {
    icon: Zap,
    title: "Settle in CC",
    body: "Grofty submits the transfer and the Canton ledger update id comes back as the receipt.",
  },
];

const profilePoints = [
  "The Party ID comes from your wallet - never invented or hard-coded",
  "You choose the username; it is checked locally",
  "Profiles and history are stored in this browser only",
];

const liveNow = [
  "Grofty wallet connection (CIP-0103) on Canton TestNet",
  "Shareable request links - the whole request travels in the URL",
  "CC settlement, with the ledger update id as the receipt",
];

const notBuilt = [
  "No backend - profiles and history live in this browser only",
  "Usernames are not globally registered",
  "CC is the only supported asset",
  "Real settlement needs an eligible Grofty wallet",
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <span className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-mint-400">
        {eyebrow}
      </span>
      <h2 className="text-[1.75rem] font-semibold tracking-tight text-mist-100 sm:text-[2rem]">
        {title}
      </h2>
      {description ? (
        <p className="text-[0.9375rem] leading-relaxed text-mist-400">{description}</p>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <section id="create" className="scroll-mt-24 border-t border-line">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-14 sm:px-8 sm:py-16">
          <CreateRequestForm />
          <PaymentHistory limit={4} heading="Payment history" hideWhenEmpty />
        </div>
      </section>

      <section id="profiles" className="scroll-mt-24 border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-14 sm:px-8 sm:py-16">
          <SectionHeading
            eyebrow="Payment profiles"
            title="Your wallet is the identity. Your username is the face."
            description="Connect Grofty and GroftPay reads your Canton Party ID, network and CC balance, then lets you pick a username - so a client pays @you instead of a 70-character address."
          />

          <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-8">
            <div className="panel flex flex-col gap-5 p-6 sm:p-7">
              <div className="flex items-center gap-4">
                <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-mint-300 to-violet-400 text-lg font-semibold text-ink-950">
                  {DEMO_PROFILE.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[1.0625rem] font-semibold tracking-tight text-mist-100">
                    {DEMO_PROFILE.displayName}
                  </p>
                  <p className="truncate text-[0.8125rem] text-mint-300">
                    @{DEMO_PROFILE.username}
                  </p>
                </div>
                <Badge tone="amber" className="ml-auto shrink-0">
                  Demo
                </Badge>
              </div>

              <p className="text-[0.8125rem] font-medium text-mist-300">{DEMO_PROFILE.headline}</p>

              <p className="flex items-start gap-2 text-[0.75rem] leading-relaxed text-mist-600">
                <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mist-500" />
                This is the built-in sample profile. It is not your identity - connect Grofty to
                create your own.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/profile/create" className={buttonClasses({ size: "lg" })}>
                  Create your profile
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/profile/${DEMO_PROFILE.username}`}
                  className={buttonClasses({ variant: "secondary", size: "lg" })}
                >
                  Open the demo
                </Link>
              </div>
            </div>

            <ul className="flex flex-col gap-3">
              {profilePoints.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[0.875rem] text-mist-400">
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-24 border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-14 sm:px-8 sm:py-16">
          <SectionHeading
            eyebrow="How it works"
            title="From request to settled, in four steps"
            description="GroftPay is deliberately thin: it builds the request, hands it to a wallet, and gets out of the way."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="panel flex flex-col gap-4 p-5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white/[0.04] text-mint-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="tabular text-[0.75rem] text-mist-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[0.9375rem] font-medium tracking-tight text-mist-100">
                      {step.title}
                    </h3>
                    <p className="text-[0.8125rem] leading-relaxed text-mist-400">{step.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="status" className="scroll-mt-24 border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel flex flex-col gap-4 p-6 sm:p-7">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-mint-400/30 bg-mint-400/10 text-mint-300">
                  <CircleCheck className="h-4 w-4" />
                </span>
                <h2 className="text-[1.0625rem] font-semibold tracking-tight text-mist-100">
                  Live today
                </h2>
              </div>
              <ul className="flex flex-col gap-2.5 text-[0.875rem] text-mist-400">
                {liveNow.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel flex flex-col gap-4 p-6 sm:p-7">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white/[0.04] text-mist-400">
                  <Minus className="h-4 w-4" />
                </span>
                <h2 className="text-[1.0625rem] font-semibold tracking-tight text-mist-100">
                  Not built yet
                </h2>
              </div>
              <ul className="flex flex-col gap-2.5 text-[0.875rem] text-mist-400">
                {notBuilt.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Minus className="mt-0.5 h-4 w-4 shrink-0 text-mist-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}