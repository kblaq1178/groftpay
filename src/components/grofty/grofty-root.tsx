"use client";

import type { ReactNode } from "react";
import { GroftyProvider } from "@groftylabs/dapp-sdk/react";

/**
 * Wraps the app in the SDK's discovery provider. Discovery runs in an effect, so the
 * server and first client render agree on the `discovering` state.
 */
export function GroftyRoot({ children }: { children: ReactNode }) {
  return <GroftyProvider discoveryTimeoutMs={1500}>{children}</GroftyProvider>;
}
