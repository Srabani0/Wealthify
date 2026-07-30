import crypto from "node:crypto";
import type { SignUploadInput } from "@wealthify/shared";
import { env } from "../../config/env.js";

// Signs a Cloudinary upload request so the browser can upload directly to
// Cloudinary without file bytes ever transiting the Express server. The
// signature covers exactly the params the client will send — the client
// must reuse this returned `folder` value verbatim or Cloudinary will
// reject the upload as a signature mismatch.
export function createUploadSignature(businessId: string, input: SignUploadInput) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `wealthify/${input.folder}/${businessId}`;
  const signature = signParams({ folder, timestamp });

  return {
    signature,
    timestamp,
    folder,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
  };
}

function signParams(params: Record<string, string | number>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  // Cloudinary's documented signing scheme: sha1(sortedParams + api_secret).
  return crypto
    .createHash("sha1")
    .update(toSign + env.CLOUDINARY_API_SECRET)
    .digest("hex");
}
