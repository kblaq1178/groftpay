"use client";

import type { PaymentRequest } from "@/lib/payment-request";

const STORAGE_KEY = "groftpay.requests.v1";
const LIMIT = 12;

export interface StoredRequest {
  code: string;
  request: PaymentRequest;
}

const EMPTY: StoredRequest[] = [];

let cachedRaw: string | null = null;
let cachedValue: StoredRequest[] = EMPTY;

function isStoredRequest(value: unknown): value is StoredRequest {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.code === "string" &&
    typeof record.request === "object" &&
    record.request !== null
  );
}

function parseStored(raw: string | null): StoredRequest[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isStoredRequest).slice(0, LIMIT);
  } catch {
    return EMPTY;
  }
}

function invalidate() {
  cachedRaw = null;
  cachedValue = EMPTY;
}

/** Stable snapshot for `useSyncExternalStore`. */
export function getRequestsSnapshot(): StoredRequest[] {
  if (typeof window === "undefined") return EMPTY;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parseStored(raw);
  }

  return cachedValue;
}

export function getRequestsServerSnapshot(): StoredRequest[] {
  return EMPTY;
}

export function subscribeToRequests(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      invalidate();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

function write(items: StoredRequest[]): StoredRequest[] {
  const trimmed = items.slice(0, LIMIT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage can be full or blocked — the share link still works without it.
  }
  invalidate();
  return trimmed;
}

export function persistRequest(entry: StoredRequest): StoredRequest[] {
  if (typeof window === "undefined") return EMPTY;
  const existing = getRequestsSnapshot().filter((item) => item.request.id !== entry.request.id);
  return write([entry, ...existing]);
}

export function removeStoredRequest(id: string): StoredRequest[] {
  if (typeof window === "undefined") return EMPTY;
  return write(getRequestsSnapshot().filter((item) => item.request.id !== id));
}

export function ownsRequest(id: string): boolean {
  return getRequestsSnapshot().some((item) => item.request.id === id);
}
