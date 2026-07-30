import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateRawMaterialInput } from "@wealthify/shared";
import * as rawMaterialsApi from "./api";
import { rawMaterialKeys } from "./queryKeys";

export function useRawMaterials() {
  return useQuery({ queryKey: rawMaterialKeys.list(), queryFn: rawMaterialsApi.listRawMaterials });
}

export function useCreateRawMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rawMaterialsApi.createRawMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rawMaterialKeys.list() }),
  });
}

export function useUpdateRawMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRawMaterialInput }) =>
      rawMaterialsApi.updateRawMaterial(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rawMaterialKeys.list() }),
  });
}

export function useDeleteRawMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rawMaterialsApi.deleteRawMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rawMaterialKeys.list() }),
  });
}
