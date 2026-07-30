import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateUserInput } from "@wealthify/shared";
import * as usersApi from "./api";
import { userKeys } from "./queryKeys";

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: usersApi.listUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      usersApi.updateUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
  });
}
