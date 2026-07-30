export const ORDER_STATUSES = ["READY", "DELIVERED", "COMPLETED", "CANCELLED"] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  READY: "Ready",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const ORDER_PAYMENT_STATUSES = ["PAID", "UNPAID"] as const;
export type OrderPaymentStatusValue = (typeof ORDER_PAYMENT_STATUSES)[number];

export const ORDER_PAYMENT_STATUS_LABELS: Record<OrderPaymentStatusValue, string> = {
  PAID: "Paid",
  UNPAID: "Unpaid",
};

export const ORDER_CHANNELS = ["INSTAGRAM", "WHATSAPP", "OFFLINE", "OTHER"] as const;
export type OrderChannelValue = (typeof ORDER_CHANNELS)[number];

export const ORDER_CHANNEL_LABELS: Record<OrderChannelValue, string> = {
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  OFFLINE: "In person",
  OTHER: "Other",
};

// Single source of truth for how a bill number displays, shared by the
// PDF template, the Orders table, and download filenames — orders from
// before bill numbering existed have none, hence the "—" fallback.
export function formatBillNumber(billNumber: number | null): string {
  if (!billNumber) return "—";
  return `BILL-${String(billNumber).padStart(4, "0")}`;
}
