"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { CircleAlert, Hourglass, Info, ShieldCheck, Wallet, Zap } from "lucide-react";

import { WalletPanel } from "@/components/grofty/wallet-panel";
import { RequestCard } from "@/components/request-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatParty, trimAmount } from "@/lib/format";
import {
  checkCcBalance,
  submitCcTransfer,
  type SettlementFailure,
} from "@/lib/grofty/settlement";
import { useGroftyWallet } from "@/lib/grofty/use-wallet";
import type { PaymentRequest } from "@/lib/payment-request";
import {
  getSettlementFor,
  recordSettlement,
  subscribeToSettlements,
} from "@/lib/settlement-store";
import { SettlementReceiptCard } from "./settlement-receipt";

const payerSteps = [
  {
    title: "Review the request",
    body: "The amount, receiving party and memo all come from the link itself.",
  },
  {
    title: "Approve in Grofty",
    body: "The wallet raises its own prompt and signs as your party. GroftPay never sees a key.",
  },
  {
    title: "Settle on the ledger",
    body: "Grofty submits the transfer to Canton and returns the ledger update id as the receipt.",
  },
];

function ConfirmRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-[0.75rem] uppercase tracking-[0.1em] text-mist-500">{label}</span>
      <span className="min-w-0 text-right text-[0.8125rem] leading-relaxed text-mist-200">{children}</span>
    </div>
  );
}

/**
 * The dedicated payer checkout for a `/pay/[id]` link.
 *
 * This route is payer-only: the recipient share dashboard lives in the create flow
 * (`CreateRequestForm` -> `RequestLinkPanel`) and is never rendered here. Anyone opening a
 * valid link - including the recipient browser - sees the request they are being asked
 * to pay, with the wallet connect step, the review rows and the explicit Grofty approval.
 */
export function PayClient({ request }: { request: PaymentRequest }) {
  const wallet = useGroftyWallet({ withBalance: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failure, setFailure] = useState<SettlementFailure | null>(null);
  const inFlight = useRef(false);

  const receipt = useSyncExternalStore(
    subscribeToSettlements,
    () => getSettlementFor(request.id),
    () => null,
  );

  const amountLabel = `${trimAmount(request.amount)} ${request.asset}`;
  const isConnected = wallet.phase === "connected";
  const isUnavailable = wallet.phase === "unavailable";
  const isRecipient = wallet.partyId !== null && wallet.partyId === request.receiver;
  const canPay = isConnected && !isRecipient;

  const balanceIssue = canPay ? checkCcBalance(wallet.balance, request.amount) : null;
  const payDisabled =
    isRecipient ||
    isUnavailable ||
    isSubmitting ||
    wallet.isConnecting ||
    (canPay && (wallet.isBalanceLoading || balanceIssue !== null));

  const handlePay = async () => {
    const client = wallet.client;
    const payerPartyId = wallet.partyId;
    if (!client || !payerPartyId || inFlight.current || isRecipient) return;

    inFlight.current = true;
    setFailure(null);
    setIsSubmitting(true);

    try {
      const outcome = await submitCcTransfer(client, request, {
        payerPartyId,
        networkId: wallet.networkId,
      });

      if (outcome.ok) {
        recordSettlement(request.id, outcome.receipt);
        wallet.refreshBalance();
      } else {
        setFailure(outcome);
      }
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  };

  // One action for the whole flow: connect the wallet when needed, otherwise submit the transfer.
  const handlePrimary = () => {
    if (payDisabled) return;
    if (!isConnected) {
      void wallet.connect();
      return;
    }
    void handlePay();
  };

  const payLabel = (() => {
    if (isRecipient) return "This is your own request";
    if (isSubmitting) return "Waiting for Grofty\u2026";
    if (wallet.isConnecting) return "Connecting Grofty\u2026";
    if (canPay && wallet.isBalanceLoading) return "Checking CC balance\u2026";
    if (balanceIssue) return "Not enough CC";
    return "Pay with Grofty";
  })();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={receipt ? "mint" : "neutral"}>{receipt ? "Settled" : "Payment request"}</Badge>
          <span className="text-[0.8125rem] text-mist-500">Canton - {request.asset}</span>
        </div>
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-mist-100 sm:text-[2.125rem]">
          {receipt ? "Payment settled " : "Pay "}
          <span className="text-gradient">{amountLabel}</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-mist-400">
          {request.receiverName
            ? `${request.receiverName} requested this payment`
            : "A Canton party requested this payment"}
          {request.memo ? ` for ${request.memo}` : ""}.{" "}
          {receipt
            ? "Grofty returned an executed transaction for this request - the ledger update id is below."
            : "Connect Grofty and approve the transfer - nothing leaves your wallet until you do."}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-8">
        <div className="flex flex-col gap-6">
          <RequestCard request={request} />
          <div className="panel flex items-start gap-3 p-5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-mist-500" />
            <p className="text-[0.8125rem] leading-relaxed text-mist-500">
              Anyone holding this link can open the request, but only the receiving party can be paid. The
              request id is <span className="font-mono text-mist-400">{request.id}</span>.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <WalletPanel wallet={wallet} />

          {receipt ? (
            <SettlementReceiptCard receipt={receipt} />
          ) : (
            <>
              <div className="panel flex flex-col gap-5 p-6 sm:p-7">
                <div className="flex flex-col gap-2">
                  <h2 className="text-[1.0625rem] font-semibold tracking-tight text-mist-100">
                    Review and approve
                  </h2>
                  <p className="text-sm leading-relaxed text-mist-400">
                    {canPay
                      ? "These are the values Grofty will sign for."
                      : "Connect Grofty above to continue."}
                  </p>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white/[0.02] p-4">
                  <ConfirmRow label="Amount">
                    <span className="tabular font-medium text-mist-100">{amountLabel}</span>
                  </ConfirmRow>
                  <ConfirmRow label="From">
                    {wallet.partyId ? (
                      <span className="font-mono text-[0.75rem]">{formatParty(wallet.partyId)}</span>
                    ) : (
                      <span className="text-mist-500">Not connected</span>
                    )}
                  </ConfirmRow>
                  <ConfirmRow label="To">
                    <span className="font-mono text-[0.75rem]">
                      {formatParty(request.receiver)}
                    </span>
                  </ConfirmRow>
                  {request.memo ? (
                    <ConfirmRow label="For">
                      <span className="break-words whitespace-pre-wrap">{request.memo}</span>
                    </ConfirmRow>
                  ) : null}
                </div>

                {isRecipient ? (
                  <p className="flex items-start gap-2 rounded-xl border border-violet-400/25 bg-violet-400/[0.07] px-4 py-3 text-[0.8125rem] leading-relaxed text-violet-300">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    This is your own payment request. Share the link with the payer instead - no transfer
                    is needed from the receiving party.
                  </p>
                ) : null}

                {balanceIssue ? (
                  <p className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-[0.8125rem] leading-relaxed text-amber-400">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    {balanceIssue.reason}
                  </p>
                ) : null}

                {failure ? (
                  <p className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-4 py-3 text-[0.8125rem] leading-relaxed text-rose-400">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    {failure.reason}
                  </p>
                ) : null}

                <Button size="xl" className="w-full" disabled={payDisabled} onClick={handlePrimary}>
                  {isSubmitting || wallet.isConnecting || (canPay && wallet.isBalanceLoading) ? (
                    <Spinner className="h-4 w-4" />
                  ) : !isConnected ? (
                    <Wallet className="h-4 w-4" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {payLabel}
                </Button>

                <p className="flex items-start gap-2 text-[0.8125rem] leading-relaxed text-mist-500">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-400" />
                  {isSubmitting
                    ? "Approve the transfer in the Grofty extension. This page waits for the ledger."
                    : "Nothing is sent until you approve it in Grofty, and this page only shows settled once the ledger returns a real update id."}
                </p>
              </div>

              <div className="panel p-6 sm:p-7">
                <h2 className="text-[1.0625rem] font-semibold tracking-tight text-mist-100">
                  What happens when you pay
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
                  <Hourglass className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  A declined prompt, a wallet that never answers, or a rejected transfer leaves the request
                  exactly as it is - unsettled.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
