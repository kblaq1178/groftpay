"use client";

import { buttonClasses } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useGroftyWallet } from "@/lib/grofty/use-wallet";
import { WalletChip } from "./wallet-chip";

export function GroftyConnectButton({ className }: { className?: string }) {
  const wallet = useGroftyWallet();

  if (wallet.phase === "discovering") {
    return (
      <span
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border border-line bg-white/[0.04] px-3.5 text-[0.8125rem] text-mist-400",
          className,
        )}
      >
        <Spinner className="h-3.5 w-3.5" />
        Detecting Grofty
      </span>
    );
  }

  if (wallet.phase === "unavailable") {
    return (
      <a
        href="https://grofty.cc"
        target="_blank"
        rel="noreferrer noopener"
        className={buttonClasses({ variant: "secondary", size: "sm", className })}
      >
        Get Grofty
      </a>
    );
  }

  if (wallet.phase === "connected" || wallet.phase === "no-account") {
    return <WalletChip wallet={wallet} />;
  }

  return (
    <button
      type="button"
      onClick={() => void wallet.connect()}
      disabled={wallet.isConnecting}
      className={buttonClasses({ variant: "secondary", size: "sm", className })}
    >
      {wallet.isConnecting ? <Spinner className="h-3.5 w-3.5" /> : null}
      {wallet.isConnecting ? "Connecting" : "Connect Grofty"}
    </button>
  );
}
