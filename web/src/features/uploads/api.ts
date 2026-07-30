import type { ApiSuccess } from "@wealthify/shared";
import { api } from "@/lib/axios";

type UploadFolder = "logos" | "products" | "receipts";

interface SignatureResponse {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
}

// Uploads directly to Cloudinary using a signature from our backend — file
// bytes never transit our own server. Uses fetch (not the shared `api`
// axios instance) since this request goes to Cloudinary, not our backend,
// and must not carry our Authorization header.
export async function uploadFile(folder: UploadFolder, file: File): Promise<UploadResult> {
  const { data } = await api.post<ApiSuccess<SignatureResponse>>("/uploads/sign", { folder });
  const { signature, timestamp, folder: signedFolder, apiKey, cloudName } = data.data;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", signedFolder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  const result = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    error?: { message: string };
  };

  if (!response.ok || !result.secure_url || !result.public_id) {
    // Surface Cloudinary's actual reason (e.g. invalid signature, unknown
    // API key) instead of a generic message — this is the only place that
    // reason is visible, since the request never touches our own backend.
    throw new Error(result.error?.message ?? "Upload failed. Please try again.");
  }

  return { url: result.secure_url, publicId: result.public_id };
}
