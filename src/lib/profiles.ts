import { DEMO_PARTY_ID } from "@/lib/demo";
import type { SupportedAsset } from "@/lib/payment-request";

/**
 * GroftPay payment profiles.
 *
 * A profile is the human-facing identity a Canton party presents when it asks to be paid. The
 * Canton Party ID is the payment identity (it comes from the connected Grofty wallet); the profile
 * is the name, handle and bio a person actually shares. The raw party id is never the visual
 * identity - it is only shown as secondary, truncated information.
 *
 * There is no backend yet. Real profiles are created in the browser and stored in
 * `src/lib/profile-store.ts` (localStorage), keyed by the connected wallet's Party ID. The static
 * registry below is a single, explicitly labelled demo profile so the product can be explored
 * without a wallet. It is never presented as any user's own identity.
 */

export interface PaymentProfile {
  /** URL slug: /profile/<username>. Unique within this browser only. */
  username: string;
  /** Name shown first on the profile. Falls back to the username. */
  displayName: string;
  /** One-line role, e.g. "Canton Builder". Optional. */
  headline?: string;
  bio: string;
  /** Avatar letters shown in the profile mark. Derived from the display name. */
  initials: string;
  /** Canton payment identity. Becomes the receiver on every request this profile creates. */
  partyId: string;
  /** Network reported by the wallet when the profile was created. */
  network: string | null;
  preferredAsset: SupportedAsset;
  /** True only for the built-in sample profile. */
  isDemo?: boolean;
  createdAt: number;
}

export const DEMO_PROFILE_USERNAME = "taiken";

/**
 * The one built-in sample profile. Labelled as a demo everywhere it appears so it is never mistaken
 * for the visitor's own identity.
 */
export const DEMO_PROFILE: PaymentProfile = {
  username: DEMO_PROFILE_USERNAME,
  displayName: "Taiken",
  headline: "Independent Canton Builder",
  bio: "Design, development and Web3 work. I take on Canton-native product and smart-contract work, and invoice in CC.",
  initials: "TA",
  partyId: DEMO_PARTY_ID,
  network: "canton:da-testnet",
  preferredAsset: "CC",
  isDemo: true,
  createdAt: 0,
};

export function listDemoProfiles(): readonly PaymentProfile[] {
  return [DEMO_PROFILE];
}

export function findDemoProfile(username: string): PaymentProfile | null {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  return normalized === DEMO_PROFILE.username ? DEMO_PROFILE : null;
}

/* -------------------------------------------------------------------------- */
/* Usernames                                                                  */
/* -------------------------------------------------------------------------- */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

/** Lowercase, URL-safe, must start and end with a letter or number. */
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,28})[a-z0-9]$/;

/** Names that would collide with app routes or the built-in sample. */
const RESERVED_USERNAMES = new Set([
  "profile",
  "profiles",
  "create",
  "new",
  "edit",
  "pay",
  "payment",
  "history",
  "api",
  "admin",
  "settings",
  "demo",
  "sample",
  DEMO_PROFILE_USERNAME,
]);

export function normalizeUsername(input: string): string {
  return (input ?? "").trim().toLowerCase();
}

/**
 * Validates a username for local use. There is no global registry, so this only enforces the
 * format - it never claims a name is unique or reserved on the network.
 */
export function describeUsernameIssue(input: string): string | null {
  const username = normalizeUsername(input);
  if (!username) return "Choose a username.";
  if (username.length < USERNAME_MIN_LENGTH) {
    return `Use at least ${USERNAME_MIN_LENGTH} characters.`;
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return `Use at most ${USERNAME_MAX_LENGTH} characters.`;
  }
  if (!/^[a-z0-9_-]+$/.test(username)) {
    return "Use lowercase letters, numbers, hyphens or underscores only.";
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "Start and end with a letter or a number.";
  }
  if (RESERVED_USERNAMES.has(username)) {
    return "That username is reserved by GroftPay. Pick another one.";
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Profile construction                                                       */
/* -------------------------------------------------------------------------- */

export function initialsFrom(source: string): string {
  const words = (source ?? "").trim().split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export interface ProfileDraft {
  username: string;
  displayName?: string;
  headline?: string;
  bio?: string;
  /** The connected wallet's Canton Party ID. */
  partyId: string;
  network: string | null;
  preferredAsset?: SupportedAsset;
}

export function createProfile(draft: ProfileDraft): PaymentProfile {
  const username = normalizeUsername(draft.username);
  const displayName = draft.displayName?.trim() || username;
  const headline = draft.headline?.trim();
  return {
    username,
    displayName,
    ...(headline ? { headline } : {}),
    bio: draft.bio?.trim() ?? "",
    initials: initialsFrom(displayName || username),
    partyId: draft.partyId.trim(),
    network: draft.network ?? null,
    preferredAsset: draft.preferredAsset ?? "CC",
    createdAt: Date.now(),
  };
}