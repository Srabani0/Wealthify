import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as businessApi from "./api";
import { businessKeys } from "./queryKeys";
import { authKeys } from "../auth/queryKeys";

export function useBusiness() {
  return useQuery({
    queryKey: businessKeys.detail(),
    queryFn: businessApi.getBusiness,
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: businessApi.updateBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.detail() });
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useUpdateBusinessLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: businessApi.updateBusinessLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.detail() });
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
