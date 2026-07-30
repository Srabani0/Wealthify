import type {
  ApiSuccess,
  AuthUser,
  BusinessProfile,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@wealthify/shared";
import { api } from "@/lib/axios";

interface AuthResponse {
  token: string;
  user: AuthUser;
  business?: BusinessProfile;
}

interface MeResponse {
  user: AuthUser;
  business: BusinessProfile;
}

export async function registerBusiness(input: RegisterInput) {
  const { data } = await api.post<ApiSuccess<AuthResponse>>("/auth/register", input);
  return data.data;
}

export async function login(input: LoginInput) {
  const { data } = await api.post<ApiSuccess<AuthResponse>>("/auth/login", input);
  return data.data;
}

export async function fetchMe() {
  const { data } = await api.get<ApiSuccess<MeResponse>>("/auth/me");
  return data.data;
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const { data } = await api.post<ApiSuccess<null>>("/auth/forgot-password", input);
  return data.data;
}

export async function resetPassword(input: ResetPasswordInput) {
  const { data } = await api.post<ApiSuccess<null>>("/auth/reset-password", input);
  return data.data;
}
