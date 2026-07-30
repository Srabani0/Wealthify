import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateCustomerInput } from "@wealthify/shared";
import * as customersApi from "./api";
import { customerKeys } from "./queryKeys";

export function useCustomers() {
  return useQuery({ queryKey: customerKeys.list(), queryFn: customersApi.listCustomers });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.createCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.list() }),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
      customersApi.updateCustomer(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.list() }),
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.deleteCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.list() }),
  });
}
