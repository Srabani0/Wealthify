import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import * as authApi from "./api";
import { authKeys } from "./queryKeys";
import { clearToken, getToken, setToken } from "@/lib/auth";

export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.fetchMe,
    enabled: Boolean(getToken()),
    retry: false,
  });
}

export function useRegisterBusiness() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.registerBusiness,
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      navigate("/dashboard");
    },
  });
}

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      navigate("/dashboard");
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  });
}

export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      navigate("/login");
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    clearToken();
    queryClient.clear();
    navigate("/login");
  };
}
