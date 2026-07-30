import type {
  AddProductImageInput,
  AddProductVariantInput,
  ApiListSuccess,
  ApiSuccess,
  CreateProductInput,
  ProductImageSummary,
  ProductListQueryInput,
  ProductSummary,
  ProductVariantSummary,
  UpdateProductInput,
  UpdateProductVariantInput,
} from "@wealthify/shared";
import { api } from "@/lib/axios";

export type ProductListParams = Partial<ProductListQueryInput>;

export async function listProducts(params: ProductListParams) {
  const { data } = await api.get<ApiListSuccess<ProductSummary>>("/products", { params });
  return data;
}

export async function getProduct(id: string) {
  const { data } = await api.get<ApiSuccess<ProductSummary>>(`/products/${id}`);
  return data.data;
}

export async function createProduct(input: CreateProductInput) {
  const { data } = await api.post<ApiSuccess<ProductSummary>>("/products", input);
  return data.data;
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const { data } = await api.patch<ApiSuccess<ProductSummary>>(`/products/${id}`, input);
  return data.data;
}

export async function deleteProduct(id: string) {
  await api.delete(`/products/${id}`);
}

export async function addProductVariant(productId: string, input: AddProductVariantInput) {
  const { data } = await api.post<ApiSuccess<ProductVariantSummary>>(
    `/products/${productId}/variants`,
    input,
  );
  return data.data;
}

export async function updateProductVariant(variantId: string, input: UpdateProductVariantInput) {
  const { data } = await api.patch<ApiSuccess<ProductVariantSummary>>(
    `/products/variants/${variantId}`,
    input,
  );
  return data.data;
}

export async function deleteProductVariant(variantId: string) {
  await api.delete(`/products/variants/${variantId}`);
}

export async function addProductImage(productId: string, input: AddProductImageInput) {
  const { data } = await api.post<ApiSuccess<ProductImageSummary>>(
    `/products/${productId}/images`,
    input,
  );
  return data.data;
}

export async function deleteProductImage(imageId: string) {
  await api.delete(`/products/images/${imageId}`);
}

export async function getVariantBarcodeBlob(variantId: string) {
  const { data } = await api.get<Blob>(`/products/variants/${variantId}/barcode`, {
    responseType: "blob",
  });
  return data;
}

export async function getVariantQrCodeBlob(variantId: string) {
  const { data } = await api.get<Blob>(`/products/variants/${variantId}/qrcode`, {
    responseType: "blob",
  });
  return data;
}
