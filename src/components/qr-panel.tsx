"use client";

import { useCallback, useEffect, useRef, type Ref } from "react";
import { Download, Maximize2, ScanLine, X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

/**
 * The QR side of a payment request. The code always encodes the full GroftPay URL that is passed
 * in — the panel never builds a URL of its own, so it can only ever point at the exact request on
 * screen. `Present` shows the same code full-screen for laptop-to-phone paying.
 */

export interface QrPanelProps {
  url: string;
  amountLabel: string;
  recipientName?: string;
  /** Base file name for the downloaded PNG (no extension). */
  filename?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function QrPanel({
  url,
  amountLabel,
  recipientName,
  filename = "groftpay-request",
  open,
  onOpenChange,
  className,
}: QrPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${filename}.png`;
    link.click();
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="rounded-2xl border border-line bg-white p-3.5 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.9)]">
        <div className="h-44 w-44">
          <QrCode value={url} canvasRef={canvasRef} title="Scan to pay" />
        </div>
      </div>

      <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-mist-400">
        <ScanLine className="h-3.5 w-3.5 text-mint-400" />
        Scan to pay
      </span>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <CopyButton
          value={url}
          size="sm"
          variant="secondary"
          label="Copy link"
          copiedLabel="Link copied"
        />
        <Button size="sm" variant="ghost" onClick={download}>
          <Download className="h-3.5 w-3.5" />
          Save PNG
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onOpenChange(true)}>
          <Maximize2 className="h-3.5 w-3.5" />
          Present
        </Button>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Payment QR code"
          onClick={close}
          className="fixed inset-0 z-[60] flex animate-fade items-center justify-center bg-ink-950/85 p-4 backdrop-blur-md"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="panel relative flex w-full max-w-md flex-col items-center gap-5 p-7 text-center"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-mist-400 transition hover:bg-white/[0.06] hover:text-mist-100"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center gap-1 pt-2">
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-mint-400">
                Scan to pay
              </span>
              <p className="tabular text-[1.75rem] font-semibold tracking-tight text-mist-100">
                {amountLabel}
              </p>
              {recipientName ? <p className="text-sm text-mist-400">to {recipientName}</p> : null}
            </div>

            <div className="rounded-3xl border border-line bg-white p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.95)]">
              <div style={{ width: "min(72vw, 19rem)", height: "min(72vw, 19rem)" }}>
                <QrCode value={url} title="Scan to pay" />
              </div>
            </div>

            <p className="max-w-xs text-[0.8125rem] leading-relaxed text-mist-500">
              Point a phone camera at the code to open this exact request.
            </p>

            <CopyButton
              value={url}
              variant="secondary"
              size="lg"
              className="w-full"
              label="Copy payment link"
              copiedLabel="Payment link copied"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QrCode({
  value,
  canvasRef,
  title,
}: {
  value: string;
  canvasRef?: Ref<HTMLCanvasElement>;
  title: string;
}) {
  return (
    <QRCodeCanvas
      ref={canvasRef}
      value={value}
      size={512}
      level="M"
      marginSize={2}
      bgColor="#FFFFFF"
      fgColor="#04060B"
      title={title}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
