import { z } from "zod";

// Folder allowlist so the frontend can never request a signature for an
// arbitrary Cloudinary destination — keeps signed uploads scoped.
export const UPLOAD_FOLDERS = ["logos", "products", "receipts"] as const;

export const signUploadSchema = z.object({
  folder: z.enum(UPLOAD_FOLDERS),
});
export type SignUploadInput = z.infer<typeof signUploadSchema>;
