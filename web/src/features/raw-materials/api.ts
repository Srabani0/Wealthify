import type {
  ApiSuccess,
  CreateRawMaterialInput,
  RawMaterialSummary,
  UpdateRawMaterialInput,
} from "@wealthify/shared";
import { api } from "@/lib/axios";

export async function listRawMaterials() {
  const { data } = await api.get<ApiSuccess<RawMaterialSummary[]>>("/raw-materials");
  return data.data;
}

export async function createRawMaterial(input: CreateRawMaterialInput) {
  const { data } = await api.post<ApiSuccess<RawMaterialSummary>>("/raw-materials", input);
  return data.data;
}

export async function updateRawMaterial(id: string, input: UpdateRawMaterialInput) {
  const { data } = await api.patch<ApiSuccess<RawMaterialSummary>>(`/raw-materials/${id}`, input);
  return data.data;
}

export async function deleteRawMaterial(id: string) {
  await api.delete(`/raw-materials/${id}`);
}
