import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateSupplierInput } from "@wealthify/shared";
import * as suppliersApi from "./api";
import { supplierKeys } from "./queryKeys";

export function useSuppliers() {
  return useQuery({ queryKey: supplierKeys.list(), queryFn: suppliersApi.listSuppliers });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: suppliersApi.createSupplier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierKeys.list() }),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupplierInput }) =>
      suppliersApi.updateSupplier(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierKeys.list() }),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: suppliersApi.deleteSupplier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierKeys.list() }),
  });
}
