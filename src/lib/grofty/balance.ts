import type { GroftyClient } from "@groftylabs/dapp-sdk";

/**
 * `client.getBalance()` is deliberately untyped — the wallet decides the payload shape.
 * Rather than guess, we look for a CC entry and show nothing when we cannot recognise one.
 */
export interface TokenBalance {
  symbol: string;
  amount: string;
}

const AMOUNT_KEYS = ["amount", "balance", "quantity", "total", "value", "available", "units"];
const SYMBOL_KEYS = ["tokenSymbol", "symbol", "asset", "instrument", "token", "currency"];

function readString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function looksLikeCc(symbol: string | null): boolean {
  if (!symbol) return false;
  return /^cc$/i.test(symbol) || /^canton coin$/i.test(symbol);
}

export function extractCcBalance(raw: unknown): TokenBalance | null {
  const seen = new Set<unknown>();
  let found: TokenBalance | null = null;

  const visit = (node: unknown, depth: number): void => {
    if (found || depth > 6 || !node || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) visit(item, depth + 1);
      return;
    }

    const record = node as Record<string, unknown>;

    // Shape A: `{ "CC": "12.5" }`
    for (const [key, value] of Object.entries(record)) {
      if (!looksLikeCc(key)) continue;
      if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value.trim())) {
        found = { symbol: "CC", amount: value.trim() };
        return;
      }
    }

    // Shape B: `{ symbol: "CC", amount: "12.5" }`
    const symbol = readString(record, SYMBOL_KEYS);
    const amount = readString(record, AMOUNT_KEYS);
    if (symbol && amount && looksLikeCc(symbol)) {
      found = { symbol: "CC", amount };
      return;
    }

    for (const value of Object.values(record)) visit(value, depth + 1);
  };

  visit(raw, 0);
  return found;
}

export async function readCcBalance(client: GroftyClient): Promise<TokenBalance | null> {
  try {
    const raw = await client.getBalance();
    return extractCcBalance(raw);
  } catch {
    return null;
  }
}
