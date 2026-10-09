export function truncateMiddle(value: string, head = 8, tail = 6): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** `hint::namespace` -> `hint::1234abcd…wxyz` */
export function formatParty(partyId: string): string {
  const separator = partyId.indexOf("::");
  if (separator === -1) return truncateMiddle(partyId, 14, 6);
  const hint = partyId.slice(0, separator);
  const namespace = partyId.slice(separator + 2);
  return `${hint}::${truncateMiddle(namespace, 8, 6)}`;
}

export function partyHint(partyId: string): string {
  const separator = partyId.indexOf("::");
  return separator === -1 ? partyId : partyId.slice(0, separator);
}

/** Drops trailing zeros from a decimal string, keeping `12` and `12.5` intact. */
export function trimAmount(amount: string): string {
  if (!amount.includes(".")) return amount;
  return amount.replace(/0+$/, "").replace(/\.$/, "");
}

export function splitAmount(amount: string): { integer: string; fraction: string } {
  const [integer, fraction = ""] = trimAmount(amount).split(".");
  return { integer: integer || "0", fraction };
}

export function formatAmount(amount: string, symbol = "CC"): string {
  return `${trimAmount(amount)} ${symbol}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const elapsed = Math.max(0, now - timestamp);
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${Math.max(1, minutes)} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDay(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
