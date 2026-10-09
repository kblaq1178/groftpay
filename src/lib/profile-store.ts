"use client";

import type { PaymentProfile } from "@/lib/profiles";
import { initialsFrom, normalizeUsername } from "@/lib/profiles";

/**
 * Browser-local payment profiles.
 *
 * GroftPay has no backend, so a profile the visitor creates lives in this browser's localStorage,
 * keyed by the connected wallet's Canton Party ID. That is honest prototype persistence, not a
 * global registry: clearing site data removes the profile, and nothing here is shared between
 * devices. The storage key and snapshot pattern mirror `requests-store.ts`.
 */

const STORAGE_KEY = "groftpay.profiles.v1";
const LIMIT = 20;

const EMPTY: PaymentProfile[] = [];

let cachedRaw: string | null = null;
let cachedValue: PaymentProfile[] = EMPTY;
let cacheValid = false;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Coerces one stored entry, dropping anything without a username and a party id. */
function toProfile(value: unknown): PaymentProfile | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  const username = typeof record.username === "string" ? normalizeUsername(record.username) : "";
  const partyId = typeof record.partyId === "string" ? record.partyId.trim() : "";
  if (!username || !partyId) return null;

  const displayName =
    typeof record.displayName === "string" && record.displayName.trim()
      ? record.displayName.trim()
      : username;
  const headline = typeof record.headline === "string" ? record.headline.trim() : "";

  return {
    username,
    displayName,
    ...(headline ? { headline } : {}),
    bio: typeof record.bio === "string" ? record.bio : "",
    initials:
      typeof record.initials === "string" && record.initials.trim()
        ? record.initials.trim()
        : initialsFrom(displayName),
    partyId,
    network: typeof record.network === "string" ? record.network : null,
    preferredAsset: "CC",
    createdAt: typeof record.createdAt === "number" ? record.createdAt : 0,
  };
}

function parse(raw: string | null): PaymentProfile[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed
      .map(toProfile)
      .filter((profile): profile is PaymentProfile => profile !== null)
      .slice(0, LIMIT);
  } catch {
    return EMPTY;
  }
}

function readStored(): PaymentProfile[] {
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

export function getProfilesSnapshot(): PaymentProfile[] {
  return readStored();
}

export function getProfilesServerSnapshot(): PaymentProfile[] {
  return EMPTY;
}

export function subscribeToProfiles(listener: () => void): () => void {
  listeners.add(listener);

  if (typeof window === "undefined") {
    return () => listeners.delete(listener);
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

function write(items: PaymentProfile[]): PaymentProfile[] {
  if (typeof window === "undefined") return EMPTY;
  const trimmed = items.slice(0, LIMIT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage can be full or blocked - the share link still works without it.
  }
  cacheValid = false;
  emit();
  return trimmed;
}

/**
 * Adds or replaces a profile. A username is unique within this browser, and a connected party id
 * maps to a single profile, so saving a new username for the same wallet replaces the old one.
 */
export function saveProfile(profile: PaymentProfile): PaymentProfile[] {
  const username = normalizeUsername(profile.username);
  const existing = readStored().filter(
    (item) => item.username !== username && item.partyId !== profile.partyId,
  );
  return write([{ ...profile, username }, ...existing]);
}

export function removeProfile(username: string): PaymentProfile[] {
  const normalized = normalizeUsername(username);
  return write(readStored().filter((item) => item.username !== normalized));
}
