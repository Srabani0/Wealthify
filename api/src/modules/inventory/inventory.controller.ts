import type { Request, Response } from "express";
import type { StockAdjustmentInput, StockMovementQueryInput } from "@wealthify/shared";
import * as inventoryService from "./inventory.service.js";
import { sendList, sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

function requireBusinessId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.businessId;
}

export async function adjustStock(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const input = req.body as StockAdjustmentInput;
  const result = await inventoryService.adjustStock(req.user.businessId, req.user.userId, input);
  sendSuccess(res, result, 201, "Stock adjusted");
}

export async function listStockMovements(req: Request, res: Response) {
  const query = req.query as unknown as StockMovementQueryInput;
  const { items, total } = await inventoryService.listStockMovements(
    requireBusinessId(req),
    query.variantId,
    query.page,
    query.pageSize,
  );
  sendList(res, items, { page: query.page, pageSize: query.pageSize, total });
}

export async function listLowStock(req: Request, res: Response) {
  const items = await inventoryService.listLowStock(requireBusinessId(req));
  sendSuccess(res, items);
}
