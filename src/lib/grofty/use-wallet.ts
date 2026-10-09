"use client";

import { useCallback, useEffect, useState } from "react";
import type { GroftyClient } from "@groftylabs/dapp-sdk";
import {
  useConnect,
  useDisconnect,
  useGrofty,
  useGroftyAccount,
} from "@groftylabs/dapp-sdk/react";

import { readCcBalance, type TokenBalance } from "@/lib/grofty/balance";
import { describeGroftyError } from "@/lib/grofty/errors";

export type WalletPhase =
  | "discovering"
  | "unavailable"
  | "disconnected"
  | "no-account"
  | "connected";

export interface GroftyWallet {
  /** The discovered SDK client — needed to submit a real transaction. */
  client: GroftyClient | null;
  phase: WalletPhase;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  partyId: string | null;
  networkId: string | null;
  signingProviderId: string | null;
  balance: TokenBalance | null;
  isBalanceLoading: boolean;
  errorMessage: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  refreshBalance: () => void;
  retryDiscovery: () => void;
  clearError: () => void;
}

interface BalanceEntry {
  key: string;
  value: TokenBalance | null;
  loading: boolean;
}

const NO_BALANCE: BalanceEntry = { key: "", value: null, loading: false };

/**
 * One place that turns the SDK's discovery / account / connect hooks into the states
 * GroftPay renders. Every wallet touch point goes through here.
 */
export function useGroftyWallet(options?: { withBalance?: boolean }): GroftyWallet {
  const withBalance = options?.withBalance ?? false;

  const { client, status, retry } = useGrofty();
  const {
    isConnected,
    account,
    networkId,
    isLoading,
    error: accountError,
    refresh,
  } = useGroftyAccount();
  const {
    connect: connectAccount,
    isConnecting,
    error: connectError,
    reset: resetConnect,
  } = useConnect();
  const {
    disconnect: disconnectAccount,
    isDisconnecting,
    error: disconnectError,
    reset: resetDisconnect,
  } = useDisconnect();

  const [entry, setEntry] = useState<BalanceEntry>(NO_BALANCE);
  const [balanceNonce, setBalanceNonce] = useState(0);

  const partyId = account?.partyId ?? null;
  const balanceKey = withBalance && isConnected && partyId ? partyId : "";

  // Keyed rather than reset in an effect: a stale entry for another party is ignored.
  const hasEntry = entry.key === balanceKey && balanceKey !== "";
  const balance = hasEntry ? entry.value : null;
  const isBalanceLoading = balanceKey !== "" && (!hasEntry || entry.loading);

  useEffect(() => {
    if (!client || !balanceKey) return;

    let cancelled = false;
    readCcBalance(client)
      .then((value) => {
        if (!cancelled) setEntry({ key: balanceKey, value, loading: false });
      })
      .catch(() => {
        if (!cancelled) setEntry({ key: balanceKey, value: null, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [client, balanceKey, balanceNonce]);

  const refreshBalance = useCallback(() => {
    setEntry((previous) => ({ ...previous, loading: previous.key !== "" }));
    setBalanceNonce((value) => value + 1);
  }, []);

  const connect = useCallback(async () => {
    resetConnect();
    try {
      const result = await connectAccount();
      if (result?.isConnected) refresh();
      return Boolean(result?.isConnected);
    } catch {
      return false;
    }
  }, [connectAccount, refresh, resetConnect]);

  const disconnect = useCallback(async () => {
    resetDisconnect();
    try {
      await disconnectAccount();
    } catch {
      // The wallet refused to disconnect — the chip already reflects reality.
    }
  }, [disconnectAccount, resetDisconnect]);

  const clearError = useCallback(() => {
    resetConnect();
    resetDisconnect();
  }, [resetConnect, resetDisconnect]);

  const phase: WalletPhase = (() => {
    if (status === "discovering") return "discovering";
    if (status === "unavailable") return "unavailable";
    if (isConnected && isLoading) return "discovering";
    if (isConnected) return account ? "connected" : "no-account";
    return "disconnected";
  })();

  const errorMessage =
    describeGroftyError(connectError) ??
    describeGroftyError(disconnectError) ??
    describeGroftyError(accountError);

  return {
    client,
    phase,
    isConnected,
    isConnecting,
    isDisconnecting,
    partyId,
    networkId: networkId ?? account?.networkId ?? null,
    signingProviderId: account?.signingProviderId ?? null,
    balance,
    isBalanceLoading,
    errorMessage,
    connect,
    disconnect,
    refreshBalance,
    retryDiscovery: retry,
    clearError,
  };
}
