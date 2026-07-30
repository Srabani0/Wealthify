import type {
  ApiListSuccess,
  ApiSuccess,
  CreatePurchaseInput,
  PurchaseListQueryInput,
  PurchaseRecord,
  PurchaseTotals,
  UpdatePurchaseInput,
} from "@wealthify/shared";
import { api } from "@/lib/axios";

export type PurchaseListParams = Partial<PurchaseListQueryInput>;

export async function listPurchases(params: PurchaseListParams) {
  const { data } = await api.get<ApiListSuccess<PurchaseRecord>>("/purchases", { params });
  return data;
}

export async function createPurchase(input: CreatePurchaseInput) {
  const { data } = await api.post<ApiSuccess<PurchaseRecord>>("/purchases", input);
  return data.data;
}

export async function updatePurchase(id: string, input: UpdatePurchaseInput) {
  const { data } = await api.patch<ApiSuccess<PurchaseRecord>>(`/purchases/${id}`, input);
  return data.data;
}

export async function deletePurchase(id: string) {
  await api.delete(`/purchases/${id}`);
}

export interface PurchaseSummaryParams {
  from?: Date;
  to?: Date;
}

export async function getPurchaseSummary(params: PurchaseSummaryParams) {
  const { data } = await api.get<ApiSuccess<PurchaseTotals>>("/purchases/summary", { params });
  return data.data;
}
