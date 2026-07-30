import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateBrandInput } from "@wealthify/shared";
import * as brandsApi from "./api";
import { brandKeys } from "./queryKeys";

export function useBrands() {
  return useQuery({ queryKey: brandKeys.list(), queryFn: brandsApi.listBrands });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: brandsApi.createBrand,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandKeys.list() }),
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBrandInput }) =>
      brandsApi.updateBrand(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandKeys.list() }),
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: brandsApi.deleteBrand,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandKeys.list() }),
  });
}
