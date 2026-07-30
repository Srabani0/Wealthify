import type {
  ApiSuccess,
  CategorySummary,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@wealthify/shared";
import { api } from "@/lib/axios";

export async function listCategories() {
  const { data } = await api.get<ApiSuccess<CategorySummary[]>>("/categories");
  return data.data;
}

export async function createCategory(input: CreateCategoryInput) {
  const { data } = await api.post<ApiSuccess<CategorySummary>>("/categories", input);
  return data.data;
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const { data } = await api.patch<ApiSuccess<CategorySummary>>(`/categories/${id}`, input);
  return data.data;
}

export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`);
}
