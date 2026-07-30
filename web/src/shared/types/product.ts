// Wire shapes returned by the products/categories/brands endpoints. As with
// BusinessProfile, Prisma's Decimal/DateTime fields serialize to JSON as
// strings, hence costPrice/sellingPrice/dates being `string` here.
export interface CategorySummary {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImageSummary {
  id: string;
  url: string;
  publicId: string;
  sortOrder: number;
}

export interface InventoryStockSummary {
  quantityOnHand: number;
  quantityReserved: number;
}

export interface ProductVariantSummary {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  variantName: string;
  attributes: Record<string, string> | null;
  costPrice: string;
  sellingPrice: string;
  mrp: string | null;
  marginPercent: string | null;
  lowStockThreshold: number;
  isActive: boolean;
  inventory: InventoryStockSummary | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  category: CategorySummary | null;
  brandId: string | null;
  brand: BrandSummary | null;
  hsnCode: string | null;
  gstRate: string;
  unit: string;
  hasVariants: boolean;
  isActive: boolean;
  images: ProductImageSummary[];
  variants: ProductVariantSummary[];
  createdAt: string;
  updatedAt: string;
}
