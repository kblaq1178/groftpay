"use client";

import type { SettlementReceipt } from "@/lib/grofty/settlement";

/**
 * Settlements are only ever written with a real Canton ledger update id, and they are kept in the
 * browser — GroftPay has no server to store a receipt on. Nothing here is inferred: a request is
 * "settled" if and only if a receipt from the wallet is present.
 */

const STORAGE_KEY = "groftpay.settlements.v1";

export type SettlementStore = Record<string, SettlementReceipt>;

const EMPTY: SettlementStore = {};

let cachedRaw: string | null = null;
let cachedValue: SettlementStore = EMPTY;
let cacheValid = false;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function isReceipt(value: unknown): value is SettlementReceipt {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.updateId === "string" && record.updateId.trim().length > 0;
}

function parse(raw: string | null): SettlementStore {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return EMPTY;
    const entries = Object.entries(parsed as Record<string, unknown>).filter((entry) => isReceipt(entry[1]));
    if (entries.length === 0) return EMPTY;
    return Object.fromEntries(entries) as SettlementStore;
  } catch {
    return EMPTY;
  }
}

function readSnapshot(): SettlementStore {
  if (typeof window === "undefined") return EMPTY;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (!cacheValid || raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
    cacheValid = true;
  }

  return cachedValue;
}

export function getSettlementsSnapshot(): SettlementStore {
  return readSnapshot();
}

export function getSettlementsServerSnapshot(): SettlementStore {
  return EMPTY;
}

export function getSettlementFor(requestId: string): SettlementReceipt | null {
  return readSnapshot()[requestId] ?? null;
}

export function subscribeToSettlements(listener: () => void): () => void {
  listeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      cacheValid = false;
      listener();
    }
  };

  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Records a verified receipt. A receipt without a ledger update id is rejected outright. */
export function recordSettlement(requestId: string, receipt: SettlementReceipt): void {
  if (typeof window === "undefined") return;
  if (!receipt.updateId || !receipt.updateId.trim()) return;

  const next: SettlementStore = { ...readSnapshot(), [requestId]: receipt };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable — the settlement still happened on-chain.
  }
  cacheValid = false;
  emit();
}
