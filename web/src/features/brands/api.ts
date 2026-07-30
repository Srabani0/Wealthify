import type { ApiSuccess, BrandSummary, CreateBrandInput, UpdateBrandInput } from "@wealthify/shared";
import { api } from "@/lib/axios";

export async function listBrands() {
  const { data } = await api.get<ApiSuccess<BrandSummary[]>>("/brands");
  return data.data;
}

export async function createBrand(input: CreateBrandInput) {
  const { data } = await api.post<ApiSuccess<BrandSummary>>("/brands", input);
  return data.data;
}

export async function updateBrand(id: string, input: UpdateBrandInput) {
  const { data } = await api.patch<ApiSuccess<BrandSummary>>(`/brands/${id}`, input);
  return data.data;
}

export async function deleteBrand(id: string) {
  await api.delete(`/brands/${id}`);
}
