import Link from "next/link";

import { GroftPayMark } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <GroftPayMark className="h-7 w-7" />
            <span className="text-sm font-semibold tracking-tight text-mist-100">
              Groft<span className="text-gradient">Pay</span>
            </span>
          </div>
          <p className="max-w-xs text-[0.8125rem] leading-relaxed text-mist-500">
            Payment requests for Canton. Give your wallet a username, share a link, settle in CC
            through Grofty.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-[0.8125rem]">
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-mist-500">
            Product
          </span>
          <Link href="/#create" className="text-mist-400 transition hover:text-mist-100">
            Create a request
          </Link>
          <Link href="/profile/create" className="text-mist-400 transition hover:text-mist-100">
            Create a profile
          </Link>
          <Link href="/profile" className="text-mist-400 transition hover:text-mist-100">
            Payment profiles
          </Link>
          <Link href="/history" className="text-mist-400 transition hover:text-mist-100">
            Payment history
          </Link>
          <Link href="/#how" className="text-mist-400 transition hover:text-mist-100">
            How it works
          </Link>
        </div>

        <div className="flex flex-col gap-3 text-[0.8125rem]">
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-mist-500">
            Status
          </span>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-mint-400/25 bg-mint-400/[0.07] px-3 py-1.5 text-[0.75rem] text-mint-300">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
            Requests + CC settlement live
          </span>
          <p className="max-w-[15rem] text-[0.75rem] leading-relaxed text-mist-500">
            Wallet connection and CC settlement run on Canton TestNet. Profiles and history are stored
            in this browser only - nothing is ever marked settled without a real ledger update id.
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-[0.75rem] text-mist-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} GroftPay. Built on Canton Network.</span>
          <span>Powered by Grofty Wallet - CIP-0103</span>
        </div>
      </div>
    </footer>
  );
}