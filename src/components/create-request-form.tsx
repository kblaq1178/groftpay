"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Coins, ShieldCheck, Wallet } from "lucide-react";

import { RequestLinkPanel } from "@/components/request-link-panel";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { formatParty } from "@/lib/format";
import { formatNetworkId } from "@/lib/grofty/network";
import { useGroftyWallet } from "@/lib/grofty/use-wallet";
import {
  MAX_CLIENT_LENGTH,
  MAX_MEMO_LENGTH,
  createPaymentRequest,
  describeAmountIssue,
  encodePaymentRequest,
  type PaymentRequest,
} from "@/lib/payment-request";
import { initialsFrom } from "@/lib/profiles";
import { persistRequest } from "@/lib/requests-store";
import { cn } from "@/lib/utils";
import { useProfileForParty } from "@/lib/use-profiles";

const QUICK_AMOUNTS = ["10", "25", "50", "100"];

interface CreatedRequest {
  code: string;
  request: PaymentRequest;
}

/** The recipient identity a request is paid to. */
export interface RequestIdentity {
  partyId: string;
  displayName: string;
  username?: string;
  network?: string | null;
}

export interface CreateRequestFormProps {
  /**
   * Locks the recipient to a known profile (the profile page's pay-me flow). Without it, the
   * recipient is always the connected wallet's own party - there is no party id to type.
   */
  preset?: RequestIdentity;
  title?: string;
  description?: string;
  submitLabel?: string;
  className?: string;
}

export function CreateRequestForm({
  preset,
  title,
  description,
  submitLabel,
  className,
}: CreateRequestFormProps) {
  const locked = Boolean(preset);
  const wallet = useGroftyWallet();
  const viewerProfile = useProfileForParty(wallet.partyId);

  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [client, setClient] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedRequest | null>(null);

  const connected = wallet.phase === "connected" && wallet.partyId !== null;

  // The request is always paid to a known identity: the profile when locked, otherwise the wallet.
  const identity: RequestIdentity | null =
    locked && preset
      ? preset
      : connected && wallet.partyId
        ? {
            partyId: wallet.partyId,
            displayName: viewerProfile?.displayName ?? "Your Grofty wallet",
            username: viewerProfile?.username,
            network: wallet.networkId,
          }
        : null;

  const receiverName = identity
    ? (viewerProfile?.displayName ?? preset?.displayName ?? "")
    : "";

  const reset = () => {
    setCreated(null);
    setAmount("");
    setMemo("");
    setClient("");
    setAmountError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identity) return;

    const issue = describeAmountIssue(amount);
    setAmountError(issue);
    if (issue) return;

    const request = createPaymentRequest({
      receiver: identity.partyId,
      amount,
      receiverName,
      memo,
      client,
    });
    const code = encodePaymentRequest(request);
    persistRequest({ code, request });
    setCreated({ code, request });
  };

  if (!locked && !identity) {
    return <ConnectGate wallet={wallet} className={className} />;
  }

  if (created) {
    return (
      <div className="flex flex-col gap-5">
        <RequestLinkPanel
          code={created.code}
          request={created.request}
          receiverHandle={identity?.username}
          onReset={reset}
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn("panel flex flex-col gap-6 p-6 sm:p-7", className)}
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-mist-500">
          Request payment
        </span>
        <h2 className="text-[1.375rem] font-semibold tracking-tight text-mist-100">
          {title ?? "Create a payment request"}
        </h2>
        <p className="text-sm leading-relaxed text-mist-400">
          {description ??
            "Set the amount and what it is for. GroftPay builds a link and QR code you can send to whoever owes you."}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/[0.03] px-4 py-3.5">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-mint-300 to-violet-400 text-[0.8125rem] font-semibold text-ink-950">
          {initialsFrom(identity?.displayName ?? "")}
        </span>
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-mist-500">
            Receiving as
          </p>
          <p className="truncate text-[0.9375rem] font-medium tracking-tight text-mist-100">
            {identity?.username ? `@${identity.username}` : formatParty(identity?.partyId ?? "")}
          </p>
          <p className="truncate text-[0.75rem] text-mist-500">
            {identity?.username ? `${identity.displayName} - ` : ""}
            {formatParty(identity?.partyId ?? "")}
            {identity?.network ? ` - ${formatNetworkId(identity.network)}` : ""}
          </p>
        </div>
      </div>

      <Field label="Amount" htmlFor="amount" error={amountError}>
        <div className="relative">
          <Input
            id="amount"
            name="amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            autoComplete="off"
            invalid={Boolean(amountError)}
            className="tabular pr-14 text-base"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-mint-300">
            CC
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(value)}
              className={cn(
                "tabular h-8 rounded-full border border-line bg-white/[0.03] px-3 text-[0.75rem] text-mist-300 transition hover:border-mint-400/40 hover:text-mint-200",
                amount === value && "border-mint-400/50 bg-mint-400/10 text-mint-200",
              )}
            >
              {value} CC
            </button>
          ))}
        </div>
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-[0.8125rem] font-medium tracking-tight text-mist-200">Asset</span>
        <div className="flex items-center gap-3 rounded-xl border border-line bg-ink-850/70 px-3.5 py-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-mint-400/40 bg-mint-400/10 px-2.5 py-1 text-[0.75rem] font-medium text-mint-200">
            <Coins className="h-3.5 w-3.5" />
            CC
          </span>
          <span className="text-[0.8125rem] text-mist-400">Canton Coin</span>
          <span className="ml-auto text-[0.6875rem] uppercase tracking-[0.1em] text-mist-600">
            Only asset
          </span>
        </div>
      </div>

      <Field
        label="Description"
        htmlFor="memo"
        optional
        hint="What the payer is paying for - shown on the request."
      >
        <Textarea
          id="memo"
          name="memo"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="Website development, logo design, smart contract work..."
          maxLength={MAX_MEMO_LENGTH}
          rows={3}
        />
        <span className="self-end text-[0.75rem] text-mist-600">
          {memo.length}/{MAX_MEMO_LENGTH}
        </span>
      </Field>

      <Field
        label="Client / project"
        htmlFor="client"
        optional
        hint="A label to tell your requests apart. Never shown as the payment purpose."
      >
        <Input
          id="client"
          name="client"
          value={client}
          onChange={(event) => setClient(event.target.value)}
          placeholder="Client or project name"
          maxLength={MAX_CLIENT_LENGTH}
          autoComplete="off"
        />
      </Field>

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        {submitLabel ?? "Create payment request"}
        <ArrowRight className="h-4 w-4" />
      </Button>

      <p className="text-[0.75rem] leading-relaxed text-mist-600">
        Creating a request only produces a share link. The CC transfer happens when the payer approves
        it inside Grofty - GroftPay never simulates a payment.
      </p>
    </form>
  );
}

function ConnectGate({
  wallet,
  className,
}: {
  wallet: ReturnType<typeof useGroftyWallet>;
  className?: string;
}) {
  const discovering = wallet.phase === "discovering";
  const unavailable = wallet.phase === "unavailable";
  const busy = discovering || wallet.isConnecting;

  return (
    <div className={cn("panel flex flex-col gap-6 p-6 sm:p-7", className)}>
      <div className="flex flex-col gap-1.5">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-mist-500">
          Request payment
        </span>
        <h2 className="text-[1.375rem] font-semibold tracking-tight text-mist-100">
          Connect Grofty to create your payment request
        </h2>
        <p className="text-sm leading-relaxed text-mist-400">
          GroftPay builds the request from your connected Canton identity. There is no party id to
          paste.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-white/[0.02] px-4 py-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white/[0.04] text-mist-400">
          <Wallet className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-medium text-mist-200">No wallet connected</p>
          <p className="text-[0.75rem] text-mist-500">
            Your Grofty wallet supplies the Party ID and the signing.
          </p>
        </div>
      </div>

      {wallet.phase === "no-account" ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-[0.8125rem] leading-relaxed text-amber-400">
          This wallet has no Canton party yet. Finish onboarding inside Grofty, then reconnect.
        </p>
      ) : null}

      {wallet.errorMessage ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-4 py-3 text-[0.8125rem] leading-relaxed text-rose-400">
          {wallet.errorMessage}
        </p>
      ) : null}

      {unavailable ? (
        <div className="flex flex-wrap gap-3">
          <a
            href="https://grofty.cc"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-b from-mint-300 to-mint-500 px-6 text-[0.9375rem] font-medium text-ink-950 transition hover:from-mint-200 hover:to-mint-400"
          >
            Get Grofty
            <ArrowRight className="h-4 w-4" />
          </a>
          <Button variant="secondary" size="lg" onClick={wallet.retryDiscovery}>
            Check again
          </Button>
        </div>
      ) : (
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => void wallet.connect()}
          disabled={busy}
        >
          {busy ? <Spinner className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
          {discovering ? "Detecting Grofty" : wallet.isConnecting ? "Connecting" : "Connect Grofty"}
        </Button>
      )}

      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[0.75rem] text-mist-500">
        <li className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-mint-400" />
          Non-custodial
        </li>
        <li className="flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5 text-mint-400" />
          Settles in CC
        </li>
        <li className="flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5 text-mint-400" />
          No account
        </li>
      </ul>
    </div>
  );
}