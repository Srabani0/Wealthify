import type { Response } from "express";
import type { PaginationMeta } from "@wealthify/shared";

export function sendSuccess<T>(res: Response, data: T, status = 200, message?: string) {
  res.status(status).json({ success: true, data, ...(message ? { message } : {}) });
}

export function sendList<T>(
  res: Response,
  data: T[],
  pagination: { page: number; pageSize: number; total: number },
) {
  const meta: PaginationMeta = {
    ...pagination,
    totalPages: Math.max(1, Math.ceil(pagination.total / pagination.pageSize)),
  };
  res.status(200).json({ success: true, data, meta });
}
