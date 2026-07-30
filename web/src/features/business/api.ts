import type {
  ApiSuccess,
  BusinessProfile,
  UpdateBusinessInput,
  UpdateBusinessLogoInput,
} from "@wealthify/shared";
import { api } from "@/lib/axios";

export async function getBusiness() {
  const { data } = await api.get<ApiSuccess<BusinessProfile>>("/business");
  return data.data;
}

export async function updateBusiness(input: UpdateBusinessInput) {
  const { data } = await api.patch<ApiSuccess<BusinessProfile>>("/business", input);
  return data.data;
}

export async function updateBusinessLogo(input: UpdateBusinessLogoInput) {
  const { data } = await api.patch<ApiSuccess<BusinessProfile>>("/business/logo", input);
  return data.data;
}
