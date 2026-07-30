import type {
  ApiSuccess,
  CreateCustomerInput,
  CustomerSummary,
  UpdateCustomerInput,
} from "@wealthify/shared";
import { api } from "@/lib/axios";

export async function listCustomers() {
  const { data } = await api.get<ApiSuccess<CustomerSummary[]>>("/customers");
  return data.data;
}

export async function createCustomer(input: CreateCustomerInput) {
  const { data } = await api.post<ApiSuccess<CustomerSummary>>("/customers", input);
  return data.data;
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  const { data } = await api.patch<ApiSuccess<CustomerSummary>>(`/customers/${id}`, input);
  return data.data;
}

export async function deleteCustomer(id: string) {
  await api.delete(`/customers/${id}`);
}
