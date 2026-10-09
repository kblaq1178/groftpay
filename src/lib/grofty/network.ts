export function formatNetworkId(networkId: string | null | undefined): string {
  if (!networkId) return "Unknown network";
  const value = networkId.startsWith("canton:") ? networkId.slice("canton:".length) : networkId;
  if (value === "da-mainnet") return "Canton Mainnet";
  if (value === "da-testnet") return "Canton Testnet";
  if (value === "da-devnet") return "Canton Devnet";
  return value;
}

export function networkSlug(networkId: string | null | undefined): string {
  if (!networkId) return "unknown";
  return networkId.startsWith("canton:") ? networkId.slice("canton:".length) : networkId;
}
