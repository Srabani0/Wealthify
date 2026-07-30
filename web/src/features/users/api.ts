import type { ApiSuccess, CreateUserInput, UpdateUserInput, UserSummary } from "@wealthify/shared";
import { api } from "@/lib/axios";

export async function listUsers() {
  const { data } = await api.get<ApiSuccess<UserSummary[]>>("/users");
  return data.data;
}

export async function createUser(input: CreateUserInput) {
  const { data } = await api.post<ApiSuccess<UserSummary>>("/users", input);
  return data.data;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const { data } = await api.patch<ApiSuccess<UserSummary>>(`/users/${id}`, input);
  return data.data;
}
