import { z } from "zod";

/**
 * GroftPay payment requests are self-contained: the share link carries the whole
 * request in its path, so there is no backend to stand up and nothing to look up.
 */

export const SUPPORTED_ASSETS = ["CC"] as const;
export type SupportedAsset = (typeof SUPPORTED_ASSETS)[number];

export const DEFAULT_ASSET: SupportedAsset = "CC";

export const MAX_AMOUNT_DECIMALS = 10;
export const MAX_MEMO_LENGTH = 140;
export const MAX_NAME_LENGTH = 60;
export const MAX_CLIENT_LENGTH = 60;

export const PARTY_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
export const AMOUNT_PATTERN = /^\d{1,21}(\.\d{1,10})?$/;

export const paymentRequestSchema = z.object({
  version: z.literal(1),
  id: z.string().min(6).max(64),
  receiver: z
    .string()
    .min(8, "A Canton party id is longer than that.")
    .max(300, "That party id is too long.")
    .refine(
      (value) => value.includes("::"),
      "A Canton party id looks like hint::namespace.",
    )
    .refine(
      (value) => !/\s/.test(value),
      "A party id cannot contain spaces.",
    ),
  amount: z
    .string()
    .regex(AMOUNT_PATTERN, `Use a decimal number with up to ${MAX_AMOUNT_DECIMALS} decimals.`)
    .refine((value) => Number(value) > 0, "Amount must be greater than zero."),
  asset: z.enum(["CC"]),
  createdAt: z.number().int().nonnegative(),
  memo: z.string().max(MAX_MEMO_LENGTH).optional(),
  receiverName: z.string().max(MAX_NAME_LENGTH).optional(),
  client: z.string().max(MAX_CLIENT_LENGTH).optional(),
});

export type PaymentRequest = z.infer<typeof paymentRequestSchema>;

export interface PaymentRequestDraft {
  receiver: string;
  amount: string;
  memo?: string;
  receiverName?: string;
  client?: string;
  asset?: SupportedAsset;
}

/** Compact wire shape — short keys keep the share link as short as possible. */
interface WirePaymentRequest {
  v: 1;
  i: string;
  r: string;
  a: string;
  s: SupportedAsset;
  t: number;
  m?: string;
  n?: string;
  c?: string;
}

const CHECKSUM_LENGTH = 6;

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function checksum(input: string): string {
  return fnv1a(input).toString(36).padStart(CHECKSUM_LENGTH, "0").slice(-CHECKSUM_LENGTH);
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function newRequestId(): string {
  const bytes = new Uint8Array(9);
  const webcrypto = globalThis.crypto;
  if (webcrypto && typeof webcrypto.getRandomValues === "function") {
    webcrypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  let id = "";
  for (let index = 0; index < bytes.length; index += 1) {
    id += bytes[index].toString(36).padStart(2, "0");
  }
  return id.slice(0, 14);
}

export function createPaymentRequest(draft: PaymentRequestDraft): PaymentRequest {
  const receiverName = draft.receiverName?.trim();
  const memo = draft.memo?.trim();
  const client = draft.client?.trim();
  return {
    version: 1,
    id: newRequestId(),
    receiver: draft.receiver.trim(),
    amount: draft.amount.trim(),
    asset: draft.asset ?? DEFAULT_ASSET,
    createdAt: Date.now(),
    ...(memo ? { memo } : {}),
    ...(receiverName ? { receiverName } : {}),
    ...(client ? { client } : {}),
  };
}

export function encodePaymentRequest(request: PaymentRequest): string {
  const wire: WirePaymentRequest = {
    v: 1,
    i: request.id,
    r: request.receiver,
    a: request.amount,
    s: request.asset,
    t: request.createdAt,
  };
  if (request.memo) wire.m = request.memo;
  if (request.receiverName) wire.n = request.receiverName;
  if (request.client) wire.c = request.client;

  const payload = JSON.stringify(wire);
  return `${toBase64Url(payload)}~${checksum(payload)}`;
}

export type DecodeResult =
  | { ok: true; request: PaymentRequest }
  | { ok: false; reason: string };

const UNREADABLE = "This payment link is not readable.";
const TAMPERED = "This payment link is incomplete or was altered in transit.";

export function decodePaymentRequest(code: string): DecodeResult {
  const trimmed = (code ?? "").trim();
  if (!trimmed) return { ok: false, reason: "This payment link is empty." };

  const separator = trimmed.lastIndexOf("~");
  if (separator <= 0 || separator === trimmed.length - 1) {
    return { ok: false, reason: TAMPERED };
  }

  const encoded = trimmed.slice(0, separator);
  const providedChecksum = trimmed.slice(separator + 1).toLowerCase();

  let payload: string;
  try {
    payload = fromBase64Url(encoded);
  } catch {
    return { ok: false, reason: UNREADABLE };
  }

  if (checksum(payload) !== providedChecksum) {
    return { ok: false, reason: TAMPERED };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { ok: false, reason: UNREADABLE };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: UNREADABLE };
  }

  const wire = parsed as Record<string, unknown>;
  const candidate = {
    version: wire.v,
    id: wire.i,
    receiver: wire.r,
    amount: wire.a,
    asset: wire.s,
    createdAt: wire.t,
    ...(typeof wire.m === "string" ? { memo: wire.m } : {}),
    ...(typeof wire.n === "string" ? { receiverName: wire.n } : {}),
    ...(typeof wire.c === "string" ? { client: wire.c } : {}),
  };

  const result = paymentRequestSchema.safeParse(candidate);
  if (!result.success) {
    return { ok: false, reason: "This payment link is missing required details." };
  }

  return { ok: true, request: result.data };
}

export function describeAmountIssue(amount: string): string | null {
  const trimmed = amount.trim();
  if (!trimmed) return "Enter an amount.";
  if (!AMOUNT_PATTERN.test(trimmed)) {
    return `Use a decimal number with up to ${MAX_AMOUNT_DECIMALS} decimals.`;
  }
  if (Number(trimmed) <= 0) return "Amount must be greater than zero.";
  return null;
}

export function describePartyIssue(partyId: string): string | null {
  const trimmed = partyId.trim();
  if (!trimmed) return "Enter the recipient party id.";
  if (/\s/.test(trimmed)) return "A party id cannot contain spaces.";
  if (!trimmed.includes("::")) return "A Canton party id looks like hint::namespace.";
  if (!PARTY_ID_PATTERN.test(trimmed)) return "That party id contains unexpected characters.";
  if (trimmed.length < 8) return "That party id looks too short.";
  return null;
}
