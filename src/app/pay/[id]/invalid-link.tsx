import Link from "next/link";
import { ArrowRight, Link2, TriangleAlert } from "lucide-react";

import { buttonClasses } from "@/components/ui/button";

export function InvalidLink({ reason }: { reason: string }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-20 sm:px-8 sm:py-28">
      <div className="panel flex flex-col gap-6 p-7 sm:p-9">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-400">
          <TriangleAlert className="h-5 w-5" />
        </span>

        <div className="flex flex-col gap-2.5">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-mist-100">
            This payment link cannot be opened
          </h1>
          <p className="text-sm leading-relaxed text-mist-400">{reason}</p>
        </div>

        <div className="rounded-2xl border border-line bg-white/[0.03] p-4">
          <p className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-mist-400">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-mist-500" />
            GroftPay links carry the request in the URL itself. If a link was shortened, wrapped or
            copied by hand, part of it may have been lost — ask for a fresh link.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/#create" className={buttonClasses({ size: "lg" })}>
            Create a new request
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/" className={buttonClasses({ variant: "secondary", size: "lg" })}>
            Back to GroftPay
          </Link>
        </div>
      </div>
    </div>
  );
}
