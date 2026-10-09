import Link from "next/link";
import { Compass } from "lucide-react";

import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-20 sm:px-8 sm:py-28">
      <div className="panel flex flex-col gap-6 p-7 sm:p-9">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/[0.04] text-mint-300">
          <Compass className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-2.5">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-mist-100">
            Nothing lives at this address
          </h1>
          <p className="text-sm leading-relaxed text-mist-400">
            GroftPay pages are the request builder, a freelancer profile, the payment history or a
            payment link. This URL is none of them.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className={buttonClasses({ size: "lg" })}>
            Back to GroftPay
          </Link>
          <Link href="/#create" className={buttonClasses({ variant: "secondary", size: "lg" })}>
            Create a payment request
          </Link>
          <Link href="/profile" className={buttonClasses({ variant: "ghost", size: "lg" })}>
            Browse profiles
          </Link>
        </div>
      </div>
    </div>
  );
}
