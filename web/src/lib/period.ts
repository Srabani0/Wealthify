export type Period = "all" | "month" | "year";

// `to` must be the END of the period, not the current instant — using
// "now" as the upper bound silently excluded same-period entries dated
// later than the exact moment the page was loaded (e.g. a purchase dated
// a few days from now within the same month never showed up under "This
// month" because "now" was earlier in the month than the entry's date).
export function getPeriodRange(period: Period): { from: Date | undefined; to: Date | undefined } {
  const now = new Date();
  if (period === "month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  if (period === "year") {
    return {
      from: new Date(now.getFullYear(), 0, 1),
      to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
    };
  }
  return { from: undefined, to: undefined };
}
