/**
 * Market providers encode prices as strings. Only accept finite numeric values
 * at the boundary so a malformed payload cannot reach UI formatting as NaN.
 */
export function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isFiniteNumberString(value: unknown): value is string {
  return typeof value === "string" && toFiniteNumber(value) !== null;
}
