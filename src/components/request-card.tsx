import type { ReactNode } from "react";
import { Briefcase, Clock, Hash, MessageSquareQuote } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatParty, formatRelativeTime, splitAmount } from "@/lib/format";
import type { PaymentRequest } from "@/lib/payment-request";

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5">
      <span className="flex items-center gap-2 text-[0.8125rem] text-mist-500">
        {icon}
        {label}
      </span>
      <span className="min-w-0 text-right text-[0.8125rem] leading-relaxed text-mist-200">
        {children}
      </span>
    </div>
  );
}

export interface RequestCardProps {
  request: PaymentRequest;
  className?: string;
  footer?: ReactNode;
  eyebrow?: string;
  /** Display-only handle for the recipient's GroftPay profile, e.g. "kehinde". */
  receiverHandle?: string;
  /** Hides the request id / timestamp rows, for decorative previews. */
  showMeta?: boolean;
}

export function RequestCard({
  request,
  className,
  footer,
  eyebrow = "Payment request",
  receiverHandle,
  showMeta = true,
}: RequestCardProps) {
  const { integer, fraction } = splitAmount(request.amount);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border border-line bg-ink-900/80",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-mint-400/12 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 bottom-0 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-mist-500">
            {eyebrow}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.04] px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-mist-300">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
            {request.asset}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2.5">
            <span className="tabular text-[2.75rem] font-semibold leading-none tracking-tight text-mist-100 sm:text-[3.25rem]">
              {integer}
              {fraction ? <span className="text-mist-300">.{fraction}</span> : null}
            </span>
            <span className="text-xl font-medium tracking-tight text-mint-300">{request.asset}</span>
          </div>
          <p className="text-sm text-mist-400">
            {request.receiverName ? (
              <>
                Requested by <span className="text-mist-200">{request.receiverName}</span>
                {receiverHandle ? (
                  <span className="text-mist-500"> @{receiverHandle}</span>
                ) : null}
              </>
            ) : (
              "Requested from this Canton party"
            )}
          </p>
        </div>

        <div className="divide-y divide-[color:var(--color-line)] border-t border-line">
          <DetailRow icon={<Hash className="h-3.5 w-3.5" />} label="To">
            <span className="break-all font-mono text-[0.75rem]">{formatParty(request.receiver)}</span>
          </DetailRow>

          {request.memo ? (
            <DetailRow icon={<MessageSquareQuote className="h-3.5 w-3.5" />} label="For">
              <span className="break-words whitespace-pre-wrap text-mist-200">{request.memo}</span>
            </DetailRow>
          ) : null}

          {request.client ? (
            <DetailRow icon={<Briefcase className="h-3.5 w-3.5" />} label="Client">
              <span className="break-words whitespace-pre-wrap text-mist-200">{request.client}</span>
            </DetailRow>
          ) : null}

          {showMeta ? (
            <>
              <DetailRow icon={<Clock className="h-3.5 w-3.5" />} label="Created">
                <span suppressHydrationWarning>{formatRelativeTime(request.createdAt)}</span>
              </DetailRow>

              <DetailRow icon={<Hash className="h-3.5 w-3.5" />} label="Request">
                <span className="font-mono text-[0.75rem] text-mist-400">{request.id}</span>
              </DetailRow>
            </>
          ) : null}
        </div>

        {footer ? <div className="pt-1">{footer}</div> : null}
      </div>
    </div>
  );
}