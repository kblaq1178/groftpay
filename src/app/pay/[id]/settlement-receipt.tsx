"use client";

import { CircleCheck, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { formatDateTime, formatParty, trimAmount } from "@/lib/format";
import { formatNetworkId } from "@/lib/grofty/network";
import type { SettlementReceipt } from "@/lib/grofty/settlement";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5">
      <span className="shrink-0 text-[0.8125rem] text-mist-500">{label}</span>
      <span className="min-w-0 text-right text-[0.8125rem] leading-relaxed text-mist-200">{children}</span>
    </div>
  );
}

export function SettlementReceiptCard({ receipt }: { receipt: SettlementReceipt }) {
  return (
    <div className="panel relative overflow-hidden p-6 sm:p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-mint-400/12 blur-3xl"
      />

      <div className="relative flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-mint-400/25 bg-mint-400/10 text-mint-300">
              <CircleCheck className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <p className="text-[0.9375rem] font-medium tracking-tight text-mist-100">
                Settled on Canton
              </p>
              <p className="text-[0.8125rem] text-mist-400">
                {trimAmount(receipt.amount)} {receipt.asset} submitted through Grofty
              </p>
            </div>
          </div>
          <Badge tone="mint">Settled</Badge>
        </div>

        <div className="divide-y divide-[color:var(--color-line)] border-t border-line">
          <Row label="Amount">
            <span className="tabular font-medium text-mist-100">
              {trimAmount(receipt.amount)} {receipt.asset}
            </span>
          </Row>
          <Row label="To">
            <span className="break-all font-mono text-[0.75rem]">{formatParty(receipt.recipientPartyId)}</span>
          </Row>
          <Row label="From">
            <span className="break-all font-mono text-[0.75rem]">{formatParty(receipt.payerPartyId)}</span>
          </Row>
          <Row label="Network">
            <span>{formatNetworkId(receipt.networkId)}</span>
          </Row>
          <Row label="Ledger update id">
            <span className="flex items-center justify-end gap-2">
              <span className="break-all font-mono text-[0.75rem] text-mist-200">{receipt.updateId}</span>
              <CopyButton value={receipt.updateId} size="sm" variant="ghost" iconOnly label="Copy update id" />
            </span>
          </Row>
          {receipt.completionOffset !== null ? (
            <Row label="Completion offset">
              <span className="tabular font-mono text-[0.75rem]">{receipt.completionOffset}</span>
            </Row>
          ) : null}
          <Row label="Settled">
            <span>{formatDateTime(receipt.settledAt)}</span>
          </Row>
        </div>

        <div className="flex flex-col gap-2">
          <p className="flex items-start gap-2 text-[0.8125rem] leading-relaxed text-mist-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-400" />
            GroftPay records this as settled only because Grofty returned an executed transaction with
            the ledger update id above. Whether the recipient still has to accept a transfer instruction
            is decided on their side and is not visible here.
          </p>
          <p className="text-[0.75rem] leading-relaxed text-mist-600">
            Saved in this browser only — GroftPay has no server and cannot look this receipt up for you
            later. Keep the update id if you need proof.
          </p>
        </div>
      </div>
    </div>
  );
}
