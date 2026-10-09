import type { GroftyClient, SimpleTransferParams } from "@groftylabs/dapp-sdk";
import {
  CHAIN_DISCONNECTED,
  DISCONNECTED,
  INTERNAL_ERROR,
  METHOD_NOT_FOUND,
  UNSUPPORTED_METHOD,
  isGroftyRpcError,
  isUnauthorized,
  isUserRejection,
} from "@groftylabs/dapp-sdk";

import { trimAmount } from "@/lib/format";
import type { TokenBalance } from "@/lib/grofty/balance";
import { describeGroftyError } from "@/lib/grofty/errors";
import type { PaymentRequest } from "@/lib/payment-request";

/**
 * Real CC settlement, built only on what @groftylabs/dapp-sdk@0.2.0 actually exposes:
 *
 *  - `GroftyClient.prepareExecuteAndWait(params)` — compiled as `this.request("prepareExecuteAndWait", params)`.
 *  - `SimpleTransferParams` — `{ receiver: partyId, amount: "<decimal>", tokenSymbol?, memo? }`.
 *  - `PrepareExecuteAndWaitResult` — `{ tx: TxExecutedEvent }`, where the executed event carries
 *    `payload.updateId` and `payload.completionOffset`.
 *
 * The SDK does not validate the wallet's reply (it returns it verbatim), so every receipt is
 * re-verified here before GroftPay will call anything settled.
 */

/** Canton MainNet, as Grofty reports it in `account.networkId`. */
export const CANTON_MAINNET = "canton:da-mainnet";

/** Canton TestNet - the network this GroftPay build settles on. */
export const CANTON_TESTNET = "canton:da-testnet";

/** Grofty's documented default token symbol for Canton Coin. */
export const CC_TOKEN_SYMBOL = "CC";

export type SettlementFailureKind =
  | "rejected"
  | "unauthorized"
  | "timeout"
  | "unsupported"
  | "disconnected"
  | "wrong-network"
  | "insufficient-balance"
  | "no-receipt"
  | "wallet";

export interface SettlementFailure {
  kind: SettlementFailureKind;
  reason: string;
  code: number | null;
}

export interface SettlementReceipt {
  /** Canton ledger update id — the real transaction identifier. */
  updateId: string;
  completionOffset: number | null;
  commandId: string | null;
  settledAt: number;
  payerPartyId: string;
  recipientPartyId: string;
  amount: string;
  asset: string;
  networkId: string | null;
}

export type SettlementOutcome = { ok: true; receipt: SettlementReceipt } | ({ ok: false } & SettlementFailure);

/** Exact, precision-safe decimal comparison (returns -1, 0 or 1). */
export function compareDecimal(left: string, right: string): number {
  const [leftInteger = "0", leftFraction = ""] = left.split(".");
  const [rightInteger = "0", rightFraction = ""] = right.split(".");

  const scale = Math.max(leftFraction.length, rightFraction.length);
  const leftScaled = BigInt((leftInteger || "0") + leftFraction.padEnd(scale, "0"));
  const rightScaled = BigInt((rightInteger || "0") + rightFraction.padEnd(scale, "0"));

  if (leftScaled === rightScaled) return 0;
  return leftScaled > rightScaled ? 1 : -1;
}

/** The exact `SimpleTransferParams` shape the SDK documents for a plain token transfer. */
export function buildCcTransferParams(request: PaymentRequest): SimpleTransferParams {
  const memo = request.memo?.trim();
  return {
    receiver: request.receiver,
    amount: request.amount,
    tokenSymbol: CC_TOKEN_SYMBOL,
    ...(memo ? { memo } : {}),
  };
}

/**
 * This build targets Canton TestNet. The guard refuses a wallet that reports MainNet (real funds
 * must never move from a TestNet demo) and lets any other wallet-reported network through,
 * including an unreported one where the wallet stays the authority. Grofty reports its own TestNet
 * id, so the exact non-MainNet value is not pinned; it is shown to the user and recorded on the
 * receipt.
 */
export function assertSettlementNetwork(
  networkId: string | null | undefined,
): SettlementFailure | null {
  if (!networkId) return null;
  if (networkId === CANTON_MAINNET) {
    return {
      kind: "wrong-network",
      code: null,
      reason: `GroftPay is running on Canton TestNet and will not settle on MainNet, which Grofty reports as "${networkId}". Switch Grofty to TestNet.`,
    };
  }
  return null;
}

/** Blocks the transfer when the wallet itself reported a CC balance below the requested amount. */
export function checkCcBalance(
  balance: TokenBalance | null | undefined,
  amount: string,
): SettlementFailure | null {
  if (!balance) return null;
  if (compareDecimal(balance.amount, amount) >= 0) return null;
  return {
    kind: "insufficient-balance",
    code: null,
    reason: `Grofty reports ${trimAmount(balance.amount)} CC in this wallet, which is less than the ${trimAmount(
      amount,
    )} CC this request needs.`,
  };
}

type ExecutedRead =
  | { kind: "executed"; updateId: string; completionOffset: number | null; commandId: string | null }
  | { kind: "failed"; commandId: string | null }
  | { kind: "unknown" };

/**
 * Strict reader for the wallet's reply. A transfer is only "executed" when the event says so *and*
 * carries a non-empty ledger update id — anything else is treated as "no receipt", never as success.
 */
export function readExecutedTransaction(raw: unknown): ExecutedRead {
  if (!raw || typeof raw !== "object") return { kind: "unknown" };

  const tx = (raw as { tx?: unknown }).tx;
  if (!tx || typeof tx !== "object") return { kind: "unknown" };

  const record = tx as Record<string, unknown>;
  const commandId = typeof record.commandId === "string" && record.commandId ? record.commandId : null;

  if (record.status === "failed") return { kind: "failed", commandId };
  if (record.status !== "executed") return { kind: "unknown" };

  const payload = record.payload;
  if (!payload || typeof payload !== "object") return { kind: "unknown" };

  const payloadRecord = payload as Record<string, unknown>;
  const updateId =
    typeof payloadRecord.updateId === "string" && payloadRecord.updateId.trim()
      ? payloadRecord.updateId.trim()
      : null;
  if (!updateId) return { kind: "unknown" };

  const completionOffset =
    typeof payloadRecord.completionOffset === "number" && Number.isFinite(payloadRecord.completionOffset)
      ? payloadRecord.completionOffset
      : null;

  return { kind: "executed", updateId, completionOffset, commandId };
}

function classifyFailure(error: unknown): SettlementFailure {
  const code = isGroftyRpcError(error) ? error.code : null;

  if (isUserRejection(error)) {
    return { kind: "rejected", code, reason: "You declined the transfer in Grofty. Nothing was sent." };
  }
  if (isUnauthorized(error)) {
    return {
      kind: "unauthorized",
      code,
      reason: "Grofty needs you to approve this site (and be signed in) before it can sign.",
    };
  }
  if (code === DISCONNECTED || code === CHAIN_DISCONNECTED) {
    return {
      kind: "disconnected",
      code,
      reason: "Grofty lost its connection to Canton. Reconnect the wallet and try again.",
    };
  }
  if (code === UNSUPPORTED_METHOD || code === METHOD_NOT_FOUND) {
    return {
      kind: "unsupported",
      code,
      reason: "This Grofty build does not support prepareExecuteAndWait. Update Grofty to 2.0.4 or newer.",
    };
  }
  if (code === INTERNAL_ERROR) {
    return {
      kind: "timeout",
      code,
      reason:
        "Grofty did not answer in time, so the transfer may or may not have been submitted. Check the wallet's activity before retrying — nothing is marked as settled here.",
    };
  }

  return {
    kind: "wallet",
    code,
    reason: describeGroftyError(error) ?? "Grofty rejected the transfer.",
  };
}

export interface SettlementContext {
  payerPartyId: string;
  networkId: string | null;
}

/**
 * Submits the CC transfer and resolves only with a verified receipt. Any other outcome — rejection,
 * timeout, insufficient balance, wrong network, an older wallet that answers `undefined` — resolves
 * as a failure and never as a settlement.
 */
export async function submitCcTransfer(
  client: GroftyClient,
  request: PaymentRequest,
  context: SettlementContext,
): Promise<SettlementOutcome> {
  const networkIssue = assertSettlementNetwork(context.networkId);
  if (networkIssue) return { ok: false, ...networkIssue };

  let raw: unknown;
  try {
    raw = await client.prepareExecuteAndWait(buildCcTransferParams(request));
  } catch (error) {
    return { ok: false, ...classifyFailure(error) };
  }

  const read = readExecutedTransaction(raw);

  if (read.kind === "failed") {
    return {
      ok: false,
      kind: "wallet",
      code: null,
      reason: "Grofty reported the transfer as failed. Nothing was settled.",
    };
  }

  if (read.kind === "unknown") {
    return {
      ok: false,
      kind: "no-receipt",
      code: null,
      reason:
        "Grofty did not return an executed transaction with a ledger update id, so GroftPay cannot confirm the transfer. Nothing is marked as settled.",
    };
  }

  return {
    ok: true,
    receipt: {
      updateId: read.updateId,
      completionOffset: read.completionOffset,
      commandId: read.commandId,
      settledAt: Date.now(),
      payerPartyId: context.payerPartyId,
      recipientPartyId: request.receiver,
      amount: request.amount,
      asset: request.asset,
      networkId: context.networkId ?? null,
    },
  };
}
