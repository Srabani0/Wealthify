import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateCategoryInput } from "@wealthify/shared";
import * as categoriesApi from "./api";
import { categoryKeys } from "./queryKeys";

export function useCategories() {
  return useQuery({ queryKey: categoryKeys.list(), queryFn: categoriesApi.listCategories });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.list() }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      categoriesApi.updateCategory(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.list() }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.list() }),
  });
}
