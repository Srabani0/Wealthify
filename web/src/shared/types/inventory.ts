export interface StockMovementSummary {
  id: string;
  variantId: string;
  type: string;
  quantity: number;
  quantityAfter: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface LowStockItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantityOnHand: number;
  lowStockThreshold: number;
}
