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

const NOT_INSTALLED =
  "Grofty Wallet not detected. Install the extension, then reload this page.";
const NO_ACCOUNT =
  "Grofty is connected but has no Canton party to sign with yet. Finish setup in the wallet.";

/** Turns anything the SDK throws into a line that is safe and useful to show a payer. */
export function describeGroftyError(error: unknown): string | null {
  if (!error) return null;

  if (isUserRejection(error)) return "You declined the request in Grofty.";
  if (isUnauthorized(error)) return "Open Grofty and approve this site to continue.";

  if (isGroftyRpcError(error)) {
    if (error.code === UNSUPPORTED_METHOD || error.code === METHOD_NOT_FOUND) {
      return "This build of Grofty does not support that action yet.";
    }
    if (error.code === INTERNAL_ERROR) {
      return "Grofty stopped answering — the approval may have timed out. Try again.";
    }
    if (error.code === DISCONNECTED || error.code === CHAIN_DISCONNECTED) {
      return "Grofty lost its connection to Canton. Reconnect the wallet and retry.";
    }
    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong while talking to Grofty.";
}

export const groftyMessages = { NOT_INSTALLED, NO_ACCOUNT };
