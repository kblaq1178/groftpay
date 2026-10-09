import { cn } from "@/lib/utils";

export function GroftPayMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="GroftPay"
      className={cn("h-8 w-8", className)}
    >
      <defs>
        <linearGradient id="groftpay-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6BEFC0" />
          <stop offset="0.55" stopColor="#34DCA0" />
          <stop offset="1" stopColor="#8B7BFF" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9.5" fill="url(#groftpay-mark)" />
      <g
        fill="none"
        stroke="#04060B"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      >
        <path d="M12.6 10.8 8.9 16l3.7 5.2" />
        <path d="M19.4 10.8 23.1 16l-3.7 5.2" />
      </g>
      <circle cx="16" cy="16" r="1.85" fill="#04060B" opacity="0.92" />
    </svg>
  );
}

export function GroftPayWordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <GroftPayMark className={markClassName} />
      <span className="text-[1.0625rem] font-semibold tracking-tight text-mist-100">
        Groft<span className="text-gradient">Pay</span>
      </span>
    </span>
  );
}
