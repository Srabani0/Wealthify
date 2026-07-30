export const STOCK_MOVEMENT_TYPES = [
  "PURCHASE_IN",
  "SALE_OUT",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "RETURN_IN",
  "RETURN_OUT",
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

// Manual stock adjustments (Phase 1) can only move stock in these two
// directions — the rest of the enum is written to by later phases
// (purchase receiving, order fulfillment/returns).
export const MANUAL_ADJUSTMENT_TYPES = ["ADJUSTMENT_IN", "ADJUSTMENT_OUT"] as const;
export type ManualAdjustmentType = (typeof MANUAL_ADJUSTMENT_TYPES)[number];
