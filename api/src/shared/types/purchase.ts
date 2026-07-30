// Wire shapes for the raw materials / suppliers / purchases endpoints.
// Decimal/DateTime fields serialize to JSON as strings, same convention as
// the rest of the app's wire types.
export interface RawMaterialSummary {
  id: string;
  name: string;
  defaultUnit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierSummary {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRecord {
  id: string;
  rawMaterialId: string;
  rawMaterial: RawMaterialSummary;
  supplierId: string | null;
  supplier: SupplierSummary | null;
  purchaseDate: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
  totalPrice: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseByMaterial {
  rawMaterialId: string;
  name: string;
  unit: string;
  totalQuantity: string;
  totalAmount: string;
}

// Computed in JS from raw rows (not a Prisma Decimal aggregate), so this is
// a genuine JSON number rather than the Decimal-serializes-to-string
// convention used elsewhere in this file.
export interface PurchaseByDay {
  date: string;
  totalAmount: number;
  count: number;
}

export interface PurchaseTotals {
  totalAmount: string;
  purchaseCount: number;
  byMaterial: PurchaseByMaterial[];
  byDay: PurchaseByDay[];
}
