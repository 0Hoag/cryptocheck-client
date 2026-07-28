export type ScanInputIssue = "invalid_evm" | "unsupported_direct" | "too_long";

export function isEvmAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isSolanaMintAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

export function looksLikeDirectAddress(value: string) {
  return value.length >= 30 && !/\s/.test(value);
}

export function validateScanInput(value: string): ScanInputIssue | null {
  if (value.startsWith("0x") && !isEvmAddress(value)) return "invalid_evm";
  if (looksLikeDirectAddress(value) && !isEvmAddress(value) && !isSolanaMintAddress(value)) return "unsupported_direct";
  if (value.length > 128) return "too_long";
  return null;
}
