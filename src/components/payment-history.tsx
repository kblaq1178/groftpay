"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRight, CircleCheck, Clock, History, Receipt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";
import { formatDateTime, formatParty, formatRelativeTime, trimAmount } from "@/lib/format";
import type { SettlementReceipt } from "@/lib/grofty/settlement";
import type { PaymentRequest } from "@/lib/payment-request";
import {
  getRequestsServerSnapshot,
  getRequestsSnapshot,
  subscribeToRequests,
  type StoredRequest,
} from "@/lib/requests-store";
import {
  getSettlementsServerSnapshot,
  getSettlementsSnapshot,
  subscribeToSettlements,
} from "@/lib/settlement-store";

/**
 * Payment history, joined from the two browser-local stores:
 *
 *  - requests this device created (`groftpay.requests.v1`)
 *  - settlement receipts this device recorded (`groftpay.settlements.v1`)
 *
 * There is no server, so this list is honest about what it can know: a request shows "Settled"
 * only when a receipt with a real ledger update id is stored here, and anything else is simply
 * "Awaiting" — which includes requests that were paid from another device.
 */

interface RequestEntry {
  kind: "request";
  key: string;
  at: number;
  code: string;
  request: PaymentRequest;
  receipt: SettlementReceipt | null;
}

interface PaymentEntry {
  kind: "payment";
  key: string;
  at: number;
  receipt: SettlementReceipt;
}

type Entry = RequestEntry | PaymentEntry;

function buildEntries(
  requests: StoredRequest[],
  settlements: Record<string, SettlementReceipt>,
): Entry[] {
  const entries: Entry[] = [];
  const matched = new Set<string>();

  for (const item of requests) {
    const receipt = settlements[item.request.id] ?? null;
    matched.add(item.request.id);
    entries.push({
      kind: "request",
      key: `request:${item.request.id}`,
      at: Math.max(item.request.createdAt, receipt?.settledAt ?? 0),
      code: item.code,
      request: item.request,
      receipt,
    });
  }

  for (const [id, receipt] of Object.entries(settlements)) {
    if (matched.has(id)) continue;
    entries.push({ kind: "payment", key: `payment:${id}`, at: receipt.settledAt, receipt });
  }

  return entries.sort((left, right) => right.at - left.at);
}

function shortUpdateId(updateId: string): string {
  return updateId.length > 18 ? `${updateId.slice(0, 10)}…${updateId.slice(-6)}` : updateId;
}

function EntryBody({ entry }: { entry: Entry }) {
  const receipt = entry.receipt;
  const settled = receipt !== null;

  if (entry.kind === "request") {
    const { request } = entry;
    const purpose = request.memo ?? "Payment request";
    return (
      <>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-sm font-medium text-mist-100">{purpose}</span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-mist-500">
            <span className="tabular text-mist-300">
              {trimAmount(request.amount)} {request.asset}
            </span>
            {request.client ? <span>· {request.client}</span> : null}
            <span>· to {formatParty(request.receiver)}</span>
            <span className="inline-flex items-center gap-1" title={formatDateTime(entry.at)}>
              · <Clock className="h-3 w-3" />
              <span suppressHydrationWarning>{formatRelativeTime(entry.at)}</span>
            </span>
          </div>
          {receipt ? (
            <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-mint-300">
              <Receipt className="h-3 w-3" />
              <span className="font-mono">{shortUpdateId(receipt.updateId)}</span>
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {settled ? (
            <Badge tone="mint">Settled</Badge>
          ) : (
            <Badge tone="neutral">Awaiting</Badge>
          )}
          <ArrowUpRight className="h-4 w-4 text-mist-500 transition group-hover:text-mint-300" />
        </div>
      </>
    );
  }

  const { receipt: payment } = entry;
  return (
    <>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="truncate text-sm font-medium text-mist-100">Payment sent</span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-mist-500">
          <span className="tabular text-mist-300">
            {trimAmount(payment.amount)} {payment.asset}
          </span>
          <span>· to {formatParty(payment.recipientPartyId)}</span>
          <span className="inline-flex items-center gap-1" title={formatDateTime(entry.at)}>
            · <Clock className="h-3 w-3" />
            <span suppressHydrationWarning>{formatRelativeTime(entry.at)}</span>
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-mint-300">
          <CircleCheck className="h-3 w-3" />
          <span className="font-mono">{shortUpdateId(payment.updateId)}</span>
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <CopyButton value={payment.updateId} size="sm" variant="ghost" iconOnly label="Copy update id" />
        <Badge tone="mint">Settled</Badge>
      </div>
    </>
  );
}

export interface PaymentHistoryProps {
  limit?: number;
  heading?: string | null;
  hideWhenEmpty?: boolean;
  className?: string;
}

export function PaymentHistory({
  limit,
  heading = "Payment history",
  hideWhenEmpty = false,
  className,
}: PaymentHistoryProps) {
  const requests = useSyncExternalStore(
    subscribeToRequests,
    getRequestsSnapshot,
    getRequestsServerSnapshot,
  );
  const settlements = useSyncExternalStore(
    subscribeToSettlements,
    getSettlementsSnapshot,
    getSettlementsServerSnapshot,
  );

  const entries = buildEntries(requests, settlements);
  const visible = typeof limit === "number" ? entries.slice(0, limit) : entries;

  if (visible.length === 0 && hideWhenEmpty) return null;

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {heading ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-mist-500">
            <History className="h-3.5 w-3.5" />
            {heading}
          </div>
          <span className="rounded-full border border-line bg-white/[0.04] px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.08em] text-mist-500">
            Saved on this device
          </span>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="panel-flat flex flex-col items-center gap-2 px-5 py-8 text-center">
          <Receipt className="h-5 w-5 text-mist-600" />
          <p className="text-sm text-mist-400">No payment requests on this device yet.</p>
          <p className="max-w-sm text-[0.8125rem] leading-relaxed text-mist-600">
            Create a request and it will show up here. GroftPay keeps no server-side copy.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((entry) =>
            entry.kind === "request" ? (
              <Link
                key={entry.key}
                href={`/pay/${entry.code}`}
                className="panel-flat group flex items-start justify-between gap-4 px-4 py-3.5 transition hover:border-line-strong hover:bg-ink-800"
              >
                <EntryBody entry={entry} />
              </Link>
            ) : (
              <div
                key={entry.key}
                className="panel-flat flex items-start justify-between gap-4 px-4 py-3.5"
              >
                <EntryBody entry={entry} />
              </div>
            ),
          )}
        </div>
      )}

      {visible.length > 0 ? (
        <p className="text-[0.75rem] leading-relaxed text-mist-600">
          Requests and receipts live in this browser only. A request only shows Settled when a receipt
          is stored here — if it was paid from another device, GroftPay cannot see that yet.
        </p>
      ) : null}
    </section>
  );
}
