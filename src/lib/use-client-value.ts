"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Reads a browser-only value without a setState-in-effect, so the server render and
 * the first client render agree and hydration stays quiet.
 *
 * `read` must return a primitive or a stable reference — useSyncExternalStore
 * re-renders whenever the snapshot changes identity.
 */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(emptySubscribe, read, () => serverValue);
}
