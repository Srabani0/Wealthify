import type { CustomerSummary } from "./customer.js";

// Flattened by the service (not a raw Prisma include mirror) so the
// frontend doesn't have to reach through `variant.product.name` for
// every line item it renders.
export interface OrderItemRecord {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  costPrice: string;
  lineTotal: string;
  lineProfit: string;
}

export interface OrderRecord {
  id: string;
  customerId: string | null;
  customer: CustomerSummary | null;
  orderDate: string;
  channel: string;
  status: string;
  paymentStatus: string;
  billNumber: number | null;
  notes: string | null;
  totalAmount: string;
  totalProfit: string;
  items: OrderItemRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderByProduct {
  variantId: string;
  productName: string;
  variantName: string;
  totalQuantity: number;
  totalAmount: string;
  totalProfit: string;
}

// Computed in JS from raw rows, same convention as PurchaseByDay — a
// genuine JSON number, not the Decimal-serializes-to-string convention
// used for fields that come straight off a Prisma model.
export interface OrderByDay {
  date: string;
  totalAmount: number;
  totalProfit: number;
  count: number;
}

export interface OrderTotals {
  totalAmount: string;
  totalProfit: string;
  orderCount: number;
  byProduct: OrderByProduct[];
  byDay: OrderByDay[];
}
