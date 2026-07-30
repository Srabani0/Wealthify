import type { ProductListParams } from "./api";

export const productKeys = {
  all: () => ["products"] as const,
  list: (params: ProductListParams) => ["products", "list", params] as const,
  detail: (id: string) => ["products", "detail", id] as const,
};
