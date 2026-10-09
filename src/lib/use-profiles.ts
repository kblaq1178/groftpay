"use client";

import { useSyncExternalStore } from "react";

import type { PaymentProfile } from "@/lib/profiles";
import {
  getProfilesServerSnapshot,
  getProfilesSnapshot,
  subscribeToProfiles,
} from "@/lib/profile-store";

/** React binding for the browser-local profile store. */
export function useProfiles(): PaymentProfile[] {
  return useSyncExternalStore(subscribeToProfiles, getProfilesSnapshot, getProfilesServerSnapshot);
}

export function useProfileByUsername(username: string): PaymentProfile | null {
  const profiles = useProfiles();
  const normalized = username.trim().toLowerCase();
  return profiles.find((profile) => profile.username === normalized) ?? null;
}

/** The profile a connected wallet owns, if the visitor has created one in this browser. */
export function useProfileForParty(partyId: string | null): PaymentProfile | null {
  const profiles = useProfiles();
  if (!partyId) return null;
  const matches = profiles.filter((profile) => profile.partyId === partyId);
  if (matches.length === 0) return null;
  return matches.reduce((latest, item) => (item.createdAt > latest.createdAt ? item : latest));
}