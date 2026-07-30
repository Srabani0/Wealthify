import { isAxiosError } from "axios";
import type { ApiError } from "@wealthify/shared";

// Handles both our backend's Axios error envelope and plain `Error`s thrown
// by non-backend calls (e.g. the direct-to-Cloudinary upload fetch) — a
// plain Error has no `.response`, so it was previously falling through to
// the generic fallback and hiding the real reason.
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (isAxiosError<ApiError>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
