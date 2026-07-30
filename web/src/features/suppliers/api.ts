import type { ApiSuccess, CreateSupplierInput, SupplierSummary, UpdateSupplierInput } from "@wealthify/shared";
import { api } from "@/lib/axios";

export async function listSuppliers() {
  const { data } = await api.get<ApiSuccess<SupplierSummary[]>>("/suppliers");
  return data.data;
}

export async function createSupplier(input: CreateSupplierInput) {
  const { data } = await api.post<ApiSuccess<SupplierSummary>>("/suppliers", input);
  return data.data;
}

export async function updateSupplier(id: string, input: UpdateSupplierInput) {
  const { data } = await api.patch<ApiSuccess<SupplierSummary>>(`/suppliers/${id}`, input);
  return data.data;
}

export async function deleteSupplier(id: string) {
  await api.delete(`/suppliers/${id}`);
}
