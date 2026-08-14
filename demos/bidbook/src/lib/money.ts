/**
 * Format a budget amount for display.
 *
 * The public API documents money as integer minor units (cents). Some builds
 * (older local APIs, and the curated seed's round-dollar data) emit dollar-major
 * values instead. We detect the unit once from the grand total's magnitude and
 * pass the result down, so a $2.6M budget never renders as $26,000 or $26M.
 */
export type MoneyScale = "minor" | "major";

/** Infer the scale from a budget's grand total. Kept for the single-number
 * case; prefer `inferScaleFromAmounts` when a whole document is available. */
export function inferScale(grandTotal: number): MoneyScale {
  const abs = Math.abs(grandTotal);
  if (abs === 0) return "minor";
  if (!Number.isInteger(grandTotal)) return "major";
  return abs >= 1_000_000 ? "minor" : "major";
}

/**
 * Infer the money scale from every amount in a budget document. Minor-unit
 * amounts are integers by definition, so any fractional value settles it as
 * dollar-major. Falls back to grand-total magnitude when all values are whole.
 */
export function inferScaleFromAmounts(
  amounts: Array<number | null | undefined>,
  grandTotal: number
): MoneyScale {
  for (const a of amounts) {
    if (typeof a === "number" && !Number.isInteger(a)) return "major";
  }
  return inferScale(grandTotal);
}

export function fmtMoney(
  amount: number | null | undefined,
  currency = "USD",
  scale: MoneyScale = "minor",
  opts: { compact?: boolean } = {}
): string {
  if (amount === null || amount === undefined) return "-";
  const major = scale === "minor" ? amount / 100 : amount;
  if (opts.compact && Math.abs(major) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(major);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(major);
}

export function fmtCompact(
  amount: number,
  currency = "USD",
  scale: MoneyScale = "minor"
): string {
  return fmtMoney(amount, currency, scale, { compact: true });
}
