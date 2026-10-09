"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, QrCode, Share2 } from "lucide-react";

import { QrPanel } from "@/components/qr-panel";
import { RequestCard } from "@/components/request-card";
import { Button, buttonClasses } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";
import { useClientValue } from "@/lib/use-client-value";
import { formatAmount, trimAmount } from "@/lib/format";
import type { PaymentRequest } from "@/lib/payment-request";

export interface RequestLinkPanelProps {
  code: string;
  request: PaymentRequest;
  /** Display-only handle for the recipient's GroftPay profile. */
  receiverHandle?: string;
  onReset?: () => void;
  className?: string;
}

/**
 * The share surface for a request: the payment card, the link, the QR code and a copy-ready
 * message. Every action here uses the same `<host>/pay/<code>` URL, so there is no way for the
 * copied link or the QR code to point at a different request than the one on screen.
 */
export function RequestLinkPanel({
  code,
  request,
  receiverHandle,
  onReset,
  className,
}: RequestLinkPanelProps) {
  const origin = useClientValue(() => window.location.origin, "");
  const canShare = useClientValue(() => typeof navigator.share === "function", false);
  const [showQr, setShowQr] = useState(false);

  const url = origin ? `${origin}/pay/${code}` : `/pay/${code}`;
  const amountLabel = formatAmount(request.amount, request.asset);
  const shareText = [
    `Payment request: ${amountLabel}${request.memo ? ` for ${request.memo}` : ""}.`,
    `Pay with GroftPay: ${url}`,
  ].join("\n");

  const share = async () => {
    if (!canShare) return;
    try {
      await navigator.share({
        title: `${amountLabel} payment request`,
        text: `${request.receiverName ?? "A Canton party"} requested ${amountLabel} on GroftPay.`,
        url,
      });
    } catch {
      // The user dismissed the share sheet - nothing to report.
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <RequestCard
        request={request}
        eyebrow="Payment request"
        receiverHandle={receiverHandle}
      />

      <div className="panel overflow-hidden">
        <div className="grid gap-7 p-6 sm:p-7 lg:grid-cols-[1.55fr_1fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-mist-500">
                Share link
              </span>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={url}
                  onFocus={(event) => event.currentTarget.select()}
                  aria-label="Payment request link"
                  className="h-12 min-w-0 flex-1 truncate rounded-xl border border-line bg-ink-850/70 px-3.5 font-mono text-[0.75rem] text-mist-200 focus:border-mint-400/60 focus:outline-none"
                />
                <CopyButton
                  value={url}
                  label="Copy"
                  iconOnly
                  className="h-12 w-12 shrink-0"
                />
              </div>
              <p className="text-[0.8125rem] leading-relaxed text-mist-500">
                The link carries the whole request. Anyone with Grofty installed can open it and pay -
                no account on GroftPay required.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <CopyButton
                value={url}
                size="lg"
                variant="primary"
                label="Copy payment link"
                copiedLabel="Payment link copied"
                className="flex-1 sm:flex-none"
              />
              <Link
                href={`/pay/${code}`}
                className={buttonClasses({ variant: "secondary", size: "lg" })}
              >
                Open payment page
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Button variant="secondary" size="lg" disabled={!origin} onClick={() => setShowQr(true)}>
                <QrCode className="h-4 w-4" />
                Show QR
              </Button>
              {canShare ? (
                <Button variant="ghost" size="lg" onClick={() => void share()}>
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            {origin ? (
              <QrPanel
                url={url}
                amountLabel={amountLabel}
                recipientName={request.receiverName}
                filename={`groftpay-${request.id}`}
                open={showQr}
                onOpenChange={setShowQr}
              />
            ) : (
              <div aria-hidden="true" className="h-44 w-44 rounded-2xl border border-line bg-white/[0.04]" />
            )}
          </div>
        </div>

        <div className="border-t border-line bg-white/[0.02] px-6 py-5 sm:px-7">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-mist-500">
                Share message
              </span>
              <CopyButton
                value={shareText}
                variant="ghost"
                size="sm"
                label="Copy message"
                copiedLabel="Message copied"
              />
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-ink-850/70 px-4 py-3 font-sans text-[0.8125rem] leading-relaxed text-mist-300">
              {shareText}
            </pre>
            <p className="text-[0.75rem] leading-relaxed text-mist-600">
              Paste it into Telegram, Discord, WhatsApp or email. GroftPay does not post anywhere on
              your behalf.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white/[0.02] px-6 py-4 sm:px-7">
          <span className="text-[0.8125rem] text-mist-500">
            Requesting <span className="text-mist-200">{trimAmount(request.amount)} CC</span> on Canton
            Testnet
          </span>
          {onReset ? (
            <Button variant="ghost" size="sm" onClick={onReset}>
              Create another
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}