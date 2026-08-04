import type {
  ApiListSuccess,
  ApiSuccess,
  CreateOrderInput,
  OrderListQueryInput,
  OrderRecord,
  OrderTotals,
  UpdateOrderInput,
} from "@wealthify/shared";
import { api } from "@/lib/axios";

export type OrderListParams = Partial<OrderListQueryInput>;

export async function listOrders(params: OrderListParams) {
  const { data } = await api.get<ApiListSuccess<OrderRecord>>("/orders", { params });
  return data;
}

export async function createOrder(input: CreateOrderInput) {
  const { data } = await api.post<ApiSuccess<OrderRecord>>("/orders", input);
  return data.data;
}

export async function updateOrder(id: string, input: UpdateOrderInput) {
  const { data } = await api.patch<ApiSuccess<OrderRecord>>(`/orders/${id}`, input);
  return data.data;
}

export async function deleteOrder(id: string) {
  await api.delete(`/orders/${id}`);
}

export interface OrderSummaryParams {
  from?: Date;
  to?: Date;
}

export async function getOrderSummary(params: OrderSummaryParams) {
  const { data } = await api.get<ApiSuccess<OrderTotals>>("/orders/summary", { params });
  return data.data;
}

export async function getOrderBillBlob(orderId: string) {
  const { data } = await api.get<Blob>(`/orders/${orderId}/bill.pdf`, { responseType: "blob" });
  return data;
}
