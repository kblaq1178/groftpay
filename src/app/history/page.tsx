import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";

import { PaymentHistory } from "@/components/payment-history";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment history",
  description: "Payment requests and settlement receipts saved in this browser.",
};

export default function HistoryPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-12 sm:px-8 sm:py-16">
      <header className="flex flex-col gap-3">
        <Badge tone="mint" className="w-fit">
          <History className="h-3.5 w-3.5" />
          Local history
        </Badge>
        <h1 className="text-[2rem] font-semibold tracking-tight text-mist-100">Payment history</h1>
        <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-mist-400">
          Every request this browser created, and every settlement receipt it recorded. GroftPay has no
          server, so the list is not shared between devices and cannot see a payment made somewhere else.
        </p>
      </header>

      <PaymentHistory heading="All activity" />

      <div className="panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.8125rem] leading-relaxed text-mist-400">
          Looking for a request created on another device? Open its GroftPay link — the whole request
          travels in the URL.
        </p>
        <Link href="/#create" className={buttonClasses({ size: "lg", className: "shrink-0" })}>
          New payment request
        </Link>
      </div>
    </div>
  );
}